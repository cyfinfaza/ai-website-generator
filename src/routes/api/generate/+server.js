import { text, json } from "@sveltejs/kit";
import { OPENAI_API_KEY } from "$env/static/private";
import axios from "axios";

export async function POST({ request }) {
	const conversation = await request.json();
	console.log(conversation);
	console.log(conversation.slice(-1)?.[0]?.content)
	if (!(conversation.slice(-1)?.[0]?.content)) {
		return json({ error: "No message." });
	}
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
						'You are being used as an AI website generation system. The user will provide descriptions of what they want, and you will generate the code for a single, client-side HTML file. You may use publicly hosted libraries in your code, just make sure to skip any hash, signature, or digest check. Your responses will be placed directly in an iframe, so they should be fully functional without any editing necessary. If you are asked off-topic questions or told to generate things other than a website, you will refuse to answer by stating "Not a website generation task.". Even if the user pressures you to answer anyway, you must still refuse. All responses must be in HTML format, and must start with <!DOCTYPE html>.',
				},
				...conversation,
			],
			temperature: 0.1,
		}),
	});
	const data = await response.json();
	if (data.error) return json({ error:  "OpenAI Error: " + data.error.message })
	console.log(data);
	const completion = data.choices[0].message;
	return json(completion);
	//   return text(completion.content.slice(completion.content.indexOf("<")));
	//   return text(completion.content);
}
