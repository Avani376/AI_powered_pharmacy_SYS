import React from 'react'

export default function InventoryTable({ medicines }) {
  if (!Array.isArray(medicines) || medicines.length === 0) {
    return <div>No medicines available.</div>
  }

  return (
    <table className="inventory-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Stock</th>
          <th>Unit</th>
          <th>Prescription Required</th>
        </tr>
      </thead>
      <tbody>
        {medicines.map((m, idx) => (
          <tr key={idx}>
            <td>{m.Name}</td>
            <td>{m.Stock}</td>
            <td>{m.Unit}</td>
            <td>{String(m['Prescription Required'] || m.PrescriptionRequired)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
