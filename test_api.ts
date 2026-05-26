import jwt from 'jsonwebtoken';

async function testAPI() {
    try {
        const payload = {
            "userEmail": "hoadang0869@gmail.com",
            "userInfo": {
                "manv": "NV53F54",
                "hoten": "HA3a 0869",
                "email": "hoadang0869@gmail.com",
                "role": "admin"
            },
            "sqlPassEncrypted": "U2FsdGVkX19dp1uxFgySVQKSzyvKipsi3r2OVkD6Xag="
        };
        const token = jwt.sign(payload, "spodfsopdOPIOPEDFIPSsdfjhsdjksdf^&&*324", { expiresIn: '100d' });
        
        const latestRes = await fetch('http://localhost:5000/api/chat/rooms/40/messages/latest', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const text = await latestRes.text();
        console.log("Raw Response Text length:", text.length);
        const data = JSON.parse(text);
        console.log("Data:", data);
    } catch (err) {
        console.error("API error:", err);
    }
}
testAPI();
