import { mockApi as localMock } from './mockApi.js'
import { httpApi } from './httpApi.js'
import { HTTP_ENABLED } from './runtime.js'

export const mockApi = HTTP_ENABLED ? httpApi : localMock