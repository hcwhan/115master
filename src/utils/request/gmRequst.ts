import { GM_xmlhttpRequest } from "$";
import { IRequest, type RequestOptions, type ResponseType } from "./types";

// GM实现
export class GMRequest extends IRequest {
	async request<T>(
		url: string,
		options: RequestOptions = {},
	): Promise<ResponseType<T>> {
		const urlRe = new URL(url);
		if (options.params) {
			Object.entries(options.params).forEach(([key, value]) => {
				urlRe.searchParams.set(key, value.toString());
			});
		}
		return new Promise((resolve, reject) => {
			GM_xmlhttpRequest({
				method: options.method || "GET",
				url: urlRe.href,
				headers: options.headers,
				data: options.body as BodyInit,
				timeout: options.timeout || 5000,
				responseType: options.responseType,
				onload: (response) => {
					let data: T;
					try {
						data = JSON.parse(response.responseText);
					} catch {
						data = response.response as unknown as T;
					}

					resolve({
						data,
						status: response.status,
						statusText: response.statusText,
						headers: this.parseResponseHeaders(response.responseHeaders),
						rawResponse: response,
					});
				},
				onerror: (e) => {
					// @ts-ignore
					reject(new Error("请求失败", { cause: e.error }));
				},
				ontimeout: () => {
					reject(new Error("请求超时"));
				},
			});
		});
	}

	get<T>(url: string, options?: RequestOptions): Promise<ResponseType<T>> {
		return this.request(url, { ...options, method: "GET" });
	}

	post<T>(
		url: string,
		data?: undefined,
		options?: RequestOptions,
	): Promise<ResponseType<T>> {
		return this.request(url, { ...options, method: "POST", body: data });
	}

	private parseResponseHeaders(headerStr: string): Record<string, string> {
		const headers: Record<string, string> = {};
		if (!headerStr) return headers;

		const headerPairs = headerStr.split("\n");
		for (let i = 0; i < headerPairs.length; i++) {
			const headerPair = headerPairs[i].trim();
			if (headerPair) {
				const index = headerPair.indexOf(":");
				if (index > 0) {
					const key = headerPair.substring(0, index).trim();
					const val = headerPair.substring(index + 1).trim();
					headers[key.toLowerCase()] = val;
				}
			}
		}
		return headers;
	}
}

export const GMRequestInstance = new GMRequest();
