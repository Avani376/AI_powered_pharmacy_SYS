const agent = require('./backend/agent');

(async function run() {
  try {
    const text = 'I want to order 2 Insulin for C005'
    console.log('Sending message to agent:', text)
    const res = await agent.validateOrder({ text })
    console.log('Agent response:')
    console.log(JSON.stringify(res, null, 2))
  } catch (err) {
    console.error('Error running test:', err)
    process.exitCode = 1
  }
})();
