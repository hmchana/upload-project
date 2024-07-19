const express = require('express');
const fileUpload = require('express-fileupload');
const xlsx = require('xlsx');
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express();
const port = 3000;

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'mydatabase'
};

app.use(cors());
app.use(fileUpload());

// Existing /upload endpoint
app.post('/upload', async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  const file1 = req.files.file1;
  const file2 = req.files.file2;

  const workbook1 = xlsx.read(file1.data);
  const workbook2 = xlsx.read(file2.data);

  const sheet1 = xlsx.utils.sheet_to_json(
    workbook1.Sheets[workbook1.SheetNames[0]]
  );
  const sheet2 = xlsx.utils.sheet_to_json(
    workbook2.Sheets[workbook2.SheetNames[0]]
  );

  const result = {
    Prix_brute: {
      A: sheet1[0]['Prix brute'] - sheet2[0]['Prix brute'],
      B: sheet1[1]['Prix brute'] + sheet2[1]['Prix brute'],
      C: sheet1[2]['Prix brute'] - sheet2[2]['Prix brute']
    },
    Prix_net: {
      A: sheet1[0]['Prix net'] - sheet2[0]['Prix net'],
      B: sheet1[1]['Prix net'] + sheet2[1]['Prix net'],
      C: sheet1[2]['Prix net'] - sheet2[2]['Prix net']
    },
    file1_name: file1.name,
    file2_name: file2.name,
    file1_type: 'bilan_mere',
    file2_type: 'bilan_filiale'
  };

  try {
    const connection = await mysql.createConnection(dbConfig);
    const [result1] = await connection.execute(
      `INSERT INTO results (A_brute, B_brute, C_brute, A_net, B_net, C_net, file1_name, file2_name, file1_type, file2_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        result.Prix_brute.A,
        result.Prix_brute.B,
        result.Prix_brute.C,
        result.Prix_net.A,
        result.Prix_net.B,
        result.Prix_net.C,
        result.file1_name,
        result.file2_name,
        result.file1_type,
        result.file2_type
      ]
    );

    await connection.end();

    res.json(result);
  } catch (error) {
    res.status(500).send('Database connection failed: ' + error.message);
  }
});

// New /results endpoint
app.get('/results', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM results');
    await connection.end();
    res.json(rows);
  } catch (error) {
    res.status(500).send('Database connection failed: ' + error.message);
  }
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
