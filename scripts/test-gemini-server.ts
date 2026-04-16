import axios from "axios";

async function testGemini() {
  try {
    const response = await axios.get("http://localhost:3000/api/admin/test-gemini");
    console.log(response.data);
  } catch (error: any) {
    console.error("Error testing Gemini:", error.response?.data || error.message);
  }
}

testGemini();
