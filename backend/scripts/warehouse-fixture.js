import { startWarehouseFixture } from '../test/helpers/warehouseFixture.js'
const fixture=await startWarehouseFixture({apiPort:Number(process.env.FIXTURE_API_PORT||3137),pgPort:Number(process.env.FIXTURE_PG_PORT||55437)})
console.log(`ISOLATED LOCAL FIXTURE ready ${fixture.base}; manager@warehouse.test / Fixture-only-2026!`)
console.log('Fixture data only. In-memory PG will be discarded on stop. No Supabase storage tested.')
let closing=false
async function stop(){if(closing)return;closing=true;await fixture.close();process.exit(0)}
process.on('SIGTERM',stop);process.on('SIGINT',stop)
