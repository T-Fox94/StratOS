import axios from "axios";

async function checkEnv() {
  try {
    const response = await axios.get("http://localhost:3000/api/admin/env-keys");
    console.log(response.data);
  } catch (error: any) {
    console.error("Error checking env:", error.message);
  }
}

checkEnv();
