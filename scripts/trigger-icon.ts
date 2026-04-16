import axios from "axios";

async function triggerIconGen() {
  try {
    const response = await axios.post("http://localhost:3000/api/admin/generate-icon");
    console.log(response.data);
  } catch (error: any) {
    console.error("Error triggering icon generation:", error.response?.data || error.message);
  }
}

triggerIconGen();
