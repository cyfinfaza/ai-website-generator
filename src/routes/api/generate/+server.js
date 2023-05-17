import { text, json } from "@sveltejs/kit";
import { OPENAI_API_KEY } from "$env/static/private";
import axios from "axios";

async function requestCompletion(conversation) {
	const response = await fetch("https://api.openai.com/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${OPENAI_API_KEY}`,
		},
		body: JSON.stringify({
			model: "gpt-3.5-turbo",
			messages: [
				{
					role: "system",
					content:
						"You are being used as an AI website generation system. The user will provide descriptions of what they want, and you will generate the code for a single HTML file. You may use publicly hosted libraries in your code, just make sure to skip any hash, signature, or digest check as your knowledge of these may be out of date. Your responses will be placed directly in an iframe, so they should be fully functional without any editing necessary. All responses must be in HTML format, and must start with <!DOCTYPE html>",
				},
				...conversation,
			],
			temperature: 0.1,
		}),
	});
	const data = await response.json();
	console.log(data);
	return data.choices[0].message;
}

export async function POST({ request }) {
	const conversation = await request.json();
	console.log(conversation);
	const completion = await requestCompletion(conversation);
	return json(completion);
	//   return text(completion.content.slice(completion.content.indexOf("<")));
	//   return text(completion.content);
}
