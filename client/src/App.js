import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import './App.css';

function App() {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [response, setResponse] = useState(null);
  const [results, setResults] = useState([]);

  const handleFile1Change = (e) => {
    setFile1(e.target.files[0]);
  };

  const handleFile2Change = (e) => {
    setFile2(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('file1', file1);
    formData.append('file2', file2);

    try {
      const res = await axios.post('http://localhost:3000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setResponse(res.data);
      fetchResults(); // Fetch results after successful upload
    } catch (error) {
      console.error('Error uploading files', error);
    }
  };

  const fetchResults = async () => {
    try {
      const res = await axios.get('http://localhost:3000/results');
      setResults(res.data);
    } catch (error) {
      console.error('Error fetching results', error);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const downloadExcel = (result) => {
    const worksheet = XLSX.utils.json_to_sheet([result]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');

    // Create binary string
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });

    // Create blob
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
    });

    // Create download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `result_${result.id}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="card">
          <h1>Upload Bilan Files</h1>
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="file1">Bilan Mere File:</label>
              <input id="file1" type="file" onChange={handleFile1Change} />
            </div>
            <div>
              <label htmlFor="file2">Bilan Filiale File:</label>
              <input id="file2" type="file" onChange={handleFile2Change} />
            </div>
            <button type="submit">Upload</button>
          </form>
        </div>

        {results.length > 0 && (
          <div className="card results-card Results">
            <h2>Results Table</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>A Brute</th>
                  <th>B Brute</th>
                  <th>C Brute</th>
                  <th>A Net</th>
                  <th>B Net</th>
                  <th>C Net</th>
                  <th>File1 Name</th>
                  <th>File1 Type</th>
                  <th>File2 Name</th>
                  <th>File2 Type</th>
                  <th>Download</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result.id}>
                    <td>{result.id}</td>
                    <td>{result.A_brute}</td>
                    <td>{result.B_brute}</td>
                    <td>{result.C_brute}</td>
                    <td>{result.A_net}</td>
                    <td>{result.B_net}</td>
                    <td>{result.C_net}</td>
                    <td>{result.file1_name}</td>
                    <td>{result.file1_type}</td>
                    <td>{result.file2_name}</td>
                    <td>{result.file2_type}</td>
                    <td>
                      <button onClick={() => downloadExcel(result)}>
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
