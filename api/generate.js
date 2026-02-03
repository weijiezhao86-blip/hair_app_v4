// api/generate.js

// 注意：我们不再需要Replicate的包了，直接使用原生的fetch
export default async function handler(req, res) {
  // 1. 从Vercel环境变量中，安全地获取我们新的Stability AI Key
  const apiKey = process.env.STABILITY_AI_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "服务器未配置API密钥" });
  }

  // 2. Stability AI的API地址和模型ID
  const engineId = 'stable-diffusion-xl-1024-v1-0';
  const apiHost = 'https://api.stability.ai';
  const apiUrl = `${apiHost}/v1/generation/${engineId}/image-to-image`;

  // 3. 检查请求方法
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // 4. 准备发送给Stability AI的数据
    // Stability AI接收的是FormData，而不是JSON
    const formData = new FormData();
    
    // 将前端传来的Base64图片数据转换为Blob对象
    const base64Response = await fetch(req.body.image);
    const imageBlob = await base64Response.blob();
    
    formData.append('init_image', imageBlob);
    formData.append('init_image_mode', 'IMAGE_STRENGTH');
    formData.append('image_strength', 0.45);
    formData.append('steps', 30);
    formData.append('seed', 0);
    formData.append('cfg_scale', 7);
    formData.append('samples', 1);
    // 这是我们给AI的指令，告诉它要生成什么发型
    formData.append('text_prompts[0][text]', 'A person with long wavy brown hair, photorealistic'); 
    formData.append('text_prompts[0][weight]', 1);

    // 5. 调用Stability AI的API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Non-200 response: ${await response.text()}`);
    }

    // 6. 处理返回的结果
    const data = await response.json();
    const imageUrl = `data:image/png;base64,${data.artifacts[0].base64}`;

    res.status(200).json({ result_url: imageUrl });

  } catch (error) {
    console.error("Stability API调用失败:", error);
    res.status(500).json({ error: "调用AI服务失败: " + error.message });
  }
}
