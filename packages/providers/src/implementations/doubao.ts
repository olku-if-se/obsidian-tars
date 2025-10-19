import { t } from '../i18n'
import type { BaseOptions, Message, NoticeSystem, RequestSystem, ResolveEmbedAsBinary, SendRequest, Vendor } from '../interfaces'

const sendRequestFunc = (settings: BaseOptions): SendRequest =>
	async function* (messages: Message[], _controller: AbortController, _resolveEmbedAsBinary: ResolveEmbedAsBinary) {
		const { parameters, frameworkConfig, ...optionsExcludingParams } = settings
		const options = { ...optionsExcludingParams, ...parameters }
		const { apiKey, baseURL, model, ...remains } = options
		if (!apiKey) throw new Error(t('API key is required'))
		if (!model) throw new Error(t('Model is required'))

		const data = {
			model,
			messages,
			stream: false,
			...remains
		}

		const waitMessage = t('This is a non-streaming request, please wait...')
		if (frameworkConfig?.noticeSystem) {
			frameworkConfig.noticeSystem.show(waitMessage)
		} else {
			console.log('Doubao:', waitMessage)
		}

		// Use injected request system or fallback to fetch
		let response
		if (frameworkConfig?.requestSystem) {
			response = await frameworkConfig.requestSystem.requestUrl(baseURL, {
				method: 'POST',
				body: JSON.stringify(data),
				headers: {
					Authorization: `Bearer ${apiKey}`,
					'Content-Type': 'application/json'
				}
			})
		} else {
			// Fallback to native fetch
			const fetchResponse = await fetch(baseURL, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${apiKey}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			})
			const responseText = await fetchResponse.text()
			// Convert Headers to plain object
			const headersObj: Record<string, string> = {}
			fetchResponse.headers.forEach((value, key) => {
				headersObj[key] = value
			})

			response = {
				status: fetchResponse.status,
				text: responseText,
				json: JSON.parse(responseText),
				headers: headersObj
			}
		}

		yield response.json.choices[0].message.content
	}

export const doubaoVendor: Vendor = {
	name: 'Doubao',
	defaultOptions: {
		apiKey: '',
		baseURL: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
		model: '',
		parameters: {}
	},
	sendRequestFunc,
	models: [],
	websiteToObtainKey: 'https://www.volcengine.com',
	capabilities: ['Text Generation']
}
