import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'

export default function Chat({ medicines = [] }) {
  const [messages, setMessages] = useState([
    { from: 'system', text: 'Welcome — type an order (e.g. "Order 2 Paracetamol for C001").' }
  ])
  const [input, setInput] = useState('')
  const listRef = useRef(null)

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages])

  function pushMessage(from, text) {
    setMessages(m => [...m, { from, text }])
  }

  function handleSend(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    pushMessage('user', text)
    setInput('')

    // extract customer id if provided in text
    const custMatch = text.match(/\bC\d+\b/i)
    const customerId = custMatch ? custMatch[0].toUpperCase() : null

    // send to backend agent for validation
    axios.post('/api/agent/validate', { text, customerId })
      .then(res => {
        const data = res.data
        if (!data || !data.ok) {
          const reason = data && data.reason ? data.reason : 'Validation failed'
          pushMessage('assistant', `Unable to validate order: ${reason}`)
          return
        }
        // compose assistant reply
        const parts = []
        if (data.message) parts.push(data.message)
        if (data.lowStock) parts.push('⚠ Low stock')
        if (data.prescriptionRequired) parts.push('🔒 Prescription required')
        pushMessage('assistant', parts.join(' | '))
      })
      .catch(() => {
        // fallback local check
        const found = medicines.find(m => text.toLowerCase().includes(m.Name.toLowerCase()))
        if (found) {
          pushMessage('assistant', `Order received: ${text}. We have ${found.Stock} ${found.Unit} in stock.`)
        } else {
          pushMessage('assistant', `Order received: ${text}. Medicine not found in inventory — please verify.`)
        }
      })
  }

  return (
    <div className="chat-container">
      <div className="chat-list" ref={listRef}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-message ${m.from}`}>
            <div className="chat-text">{m.text}</div>
          </div>
        ))}
      </div>
      <form className="chat-form" onSubmit={handleSend}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type order, press Enter to send"
        />
        <button type="submit">Send</button>
      </form>
    </div>
  )
}
