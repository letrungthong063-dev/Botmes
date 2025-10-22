const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

module.exports.config = {
    name: "circle",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "GPT-5 chuyển từ Discord bot",
    description: "Cắt ảnh reply thành hình tròn (PNG nền trong suốt)",
    commandCategory: "image",
    usages: "",
    cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
    try {
        // Kiểm tra có reply vào ảnh không
        if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0)
            return api.sendMessage("⚠️ Vui lòng reply vào một tin nhắn có ảnh!", event.threadID, event.messageID);

        const attachment = event.messageReply.attachments[0];
        if (!attachment.url || !attachment.type.startsWith("photo"))
            return api.sendMessage("❌ Tin nhắn bạn reply không có ảnh hợp lệ!", event.threadID, event.messageID);

        const cacheDir = path.join(__dirname, "cache");
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

        const inputPath = path.join(cacheDir, `circle_in_${Date.now()}.png`);
        const outputPath = path.join(cacheDir, `circle_out_${Date.now()}.png`);

        // Tải ảnh từ URL
        const response = await axios.get(attachment.url, { responseType: "arraybuffer" });
        fs.writeFileSync(inputPath, Buffer.from(response.data, "binary"));

        // Cắt hình tròn
        const image = await loadImage(inputPath);
        const size = Math.min(image.width, image.height);
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext("2d");

        // Vẽ mask tròn
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(image, (size - image.width) / 2, (size - image.height) / 2, image.width, image.height);

        const buffer = canvas.toBuffer("image/png");
        fs.writeFileSync(outputPath, buffer);

        // Gửi ảnh kết quả
        await api.sendMessage({
            body: "✨ Ảnh đã được cắt thành hình tròn!",
            attachment: fs.createReadStream(outputPath)
        }, event.threadID, () => {
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);
        }, event.messageID);

    } catch (err) {
        console.error(err);
        api.sendMessage("❌ Đã xảy ra lỗi khi xử lý ảnh!", event.threadID, event.messageID);
    }
};
