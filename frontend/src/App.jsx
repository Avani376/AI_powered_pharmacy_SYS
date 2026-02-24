import React, { useEffect, useState } from 'react'
import axios from 'axios'
import InventoryTable from './components/InventoryTable'
import Chat from './components/Chat'

export default function App() {
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [alertsLoading, setAlertsLoading] = useState(true)


  useEffect(() => {
    let mounted = true
    setLoading(true)
    axios.get('/api/inventory')
      .then(res => {
        if (mounted) setMedicines(res.data)
      })
      .catch(err => {
        if (mounted) setError(err.message || 'Failed to load')
      })
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    let mounted = true
    setAlertsLoading(true)
    axios.get('/api/alerts')
      .then(res => { if (mounted) setAlerts(res.data) })
      .catch(() => { if (mounted) setAlerts([]) })
      .finally(() => mounted && setAlertsLoading(false))
    return () => { mounted = false }
  }, [])

  return (
    <div className="app">
      <header className="header">
        <h1>Pharmacist Dashboard</h1>
      </header>
      <div className="dashboard">
        <section className="content">
          <h2>Inventory</h2>
          <div className="card">
            {alertsLoading ? (
              <div className="status">Checking refill alerts…</div>
            ) : alerts && alerts.length > 0 ? (
              <div className="alerts">
                <strong>Refill Alerts</strong>
                <ul>
                  {alerts.map(a => (
                    <li key={a.customerId}>{a.customerId}: last {a.lastMedicine} {a.daysSinceLastOrder} days ago</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {loading && <div className="status">Loading inventory…</div>}
            {error && <div className="status error">{error}</div>}
            {!loading && !error && <InventoryTable medicines={medicines} />}
          </div>
        </section>

        <aside className="sidebar">
          <h2>Order Chat</h2>
          <div className="card">
            <Chat medicines={medicines} />
          </div>
        </aside>
      </div>
    </div>
  )
}
