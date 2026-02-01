// api/generate.js

// 引入Replicate的官方Node.js客户端
import Replicate from "replicate";

// 这是云函数的核心处理逻辑
export default async function handler(req, res) {
  // 1. 安全地从环境变量中获取您的API Key
  //    我们稍后会在Vercel上设置这个变量
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_KEY,
  });

  // 2. 检查请求方法是否为POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }
    
  try {
    // 3. 从请求中获取用户上传的人脸图片URL (Base64格式)
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: '没有提供图片' });
    }

    // 4. 定义我们要使用的AI模型和输入
    // 我们选择一个在Replicate上很流行的发型替换模型
    // 您可以去Replicate网站寻找更适合的模型，然后替换掉这个`model` ID
    const model = "rotembeng/hair-replacement:3b334acee17326DEB394471E1B939645550C45041B75DF61B85D6F97D3C523B0";
    const input = {
      // 将用户的人脸图片作为输入
      source_image: image,
      // 在这里，我们先硬编码一个目标发型作为示例
      // 终极版本可以改成让用户输入文字，来动态改变这个目标
      target_hair: "a photo of a woman with long wavy brown hair", 
    };

    // 5. 调用Replicate API，让AI开始工作
    console.log("正在调用Replicate模型:", model);
    const output = await replicate.run(model, { input });
    console.log("成功获取Replicate输出:", output);

    // 6. 将AI生成的结果图片URL返回给前端
    // Replicate通常会返回一个数组，我们取第一个结果
    if (output && output.length > 0) {
      res.status(200).json({ result_url: output[0] });
    } else {
      throw new Error("AI未能生成图片");
    }

  } catch (error) {
    console.error("Replicate API调用失败:", error);
    res.status(500).json({ error: "调用AI服务失败" });
  }
}
