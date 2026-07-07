const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

async function testAnalyze() {
  try {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwZDVlY2I3NGQ2YmI4OTI4NzQxM2Q3MSIsInJvbGUiOiJqb2JzZWVrZXIiLCJpYXQiOjE3ODM0MjkzMzMsImV4cCI6MTgxNDk2NTMzM30.hmXO5Xj3Iq47CKHFln8w5dNyMBdFabsHrpV-MrMESxA';

    const form = new FormData();
    form.append('jobRole', 'Software Engineer');
    form.append('jobDescription', 'Must know React and Node.js');
    
    // Create a dummy PDF
    const dummyPdfPath = path.join(__dirname, 'dummy.pdf');
    fs.writeFileSync(dummyPdfPath, 'Dummy PDF content');
    
    form.append('resume', fs.createReadStream(dummyPdfPath));

    const res = await axios.post('http://localhost:5000/api/user/analyze-resume', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log(res.data);
  } catch (err) {
    if (err.response) {
      console.error('Error Response:', err.response.data);
    } else {
      console.error(err.message);
    }
  }
}

testAnalyze();
