import 'dotenv/config'
import { app } from './app.js'
import { pingDb } from './db.js'
import { connectMqtt } from './mqttClient.js'

async function main() {
  await pingDb()
  console.log('[db] connected')

  connectMqtt()

  const port = Number(process.env.PORT || 3000)
  app.listen(port, () => console.log(`[http] listening on http://localhost:${port}`))
}

main().catch((err) => {
  console.error('[startup] failed:', err)
  process.exit(1)
})
