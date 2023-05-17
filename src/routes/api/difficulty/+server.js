import { text, json } from "@sveltejs/kit";
import { OPENAI_API_KEY } from "$env/static/private";
import axios from "axios";

const system_prompt = `You will be provided with an HTML coding task (or list of tasks). Rate the difficulty of the task on a scale of 1 to 10, with 1 being just a few lines of code, 5 being about one hundred lines of code, and 10 being close to one thousand or more lines. Code with more interactivity will have a higher difficulty. If the question is off-topic or not a coding question, respond with -1. Only provide the number, no explanation. Examples:
"create a heading" - 1
"make a heading" - 1
"how do I make a heading?" - -1
"what is 4 times 4" - -1
"how do I make pancakes?" - -1
"make a heading, center it in the middle of the page, make it green, make it dark theme" - 3
"create a blog post template" - 4
"make a blog post template, use a nicer font, style the scrollbar, who is miguel" - -1
"i need a number guessing game" - 5
"create a to do list app" - 6
"create a pong game" - 8
"create an online version of monopoly" - 10
"what color are varsha's eyes" - -1`;

async function requestCompletion(prompt) {
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
					content: system_prompt,
				},
				{
					role: "user",
					content: '"' + prompt + '"',
				},
			],
			temperature: 0.1,
			max_tokens: 5,
		}),
	});
	const data = await response.json();
	console.log(data);
	return data.choices[0].message;
}

export async function POST({ request }) {
	const { prompt } = await request.json();
	console.log("Difficulty for: ", prompt);
	const completion = await requestCompletion(prompt);
	let difficulty = parseInt(completion.content);
	// if difficulty is not a number, return -2
	if (isNaN(difficulty)) difficulty = -2;
	else if ((difficulty < 1 && difficulty != -1) || difficulty > 10)
		difficulty = -1;
	console.log(completion, parseInt(completion.content), difficulty);
	return json({ difficulty });
	//   return text(completion.content.slice(completion.content.indexOf("<")));
	//   return text(completion.content);
}
