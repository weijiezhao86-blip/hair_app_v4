import { Writable } from 'stream';

// 一个辅助函数，用于将请求的流数据读入一个Buffer
async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export const config = {
  api: {
    bodyParser: false, // 告诉Vercel，我们自己处理请求体，你别管！
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const apiKey = process.env.STABILITY_AI_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "服务器未配置API密钥" });
  }

  try {
    const imageBuffer = await buffer(req); // 读取前端发来的二进制图片数据

    const formData = new FormData();
    formData.append('init_image', new Blob([imageBuffer]));
    formData.append('init_image_mode', 'IMAGE_STRENGTH');
    formData.append('image_strength', 0.45);
    formData.append('steps', 30);
    formData.append('text_prompts[0][text]', 'A person with long wavy brown hair, photorealistic, high quality');
    formData.append('text_prompts[0][weight]', 1);

    const response = await fetch(
      "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image",
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Non-200 response: ${await response.text()}`);
    }

    const data = await response.json();
    const imageUrl = `data:image/png;base64,${data.artifacts[0].base64}`;

    res.status(200).json({ result_url: imageUrl });

  } catch (error) {
    console.error("API调用失败:", error);
    res.status(500).json({ error: "调用AI服务失败: " + error.message });
  }
}
