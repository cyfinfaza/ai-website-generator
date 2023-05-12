import { text, json } from "@sveltejs/kit";
import { OPENAI_API_KEY } from "$env/static/private";
import axios from "axios";

async function requestCompletion(conversation) {
  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are being used as a code generation system. The user will provide descriptions of what they want, and you will generate the code. Your code will go directly into their editor. Your responses must be in HTML format, and must start with <!DOCTYPE html>",
        },
        ...conversation,
      ],
      temperature: 0.1,
    },
    { headers: { Authorization: `Bearer ${OPENAI_API_KEY}` } }
  );
  console.log(response.data);
  return response.data.choices[0].message;
}

export async function POST({ request }) {
  const conversation = await request.json();
  console.log(conversation);
  const completion = await requestCompletion(conversation);
  return json(completion);
  //   return text(completion.content.slice(completion.content.indexOf("<")));
  //   return text(completion.content);
}
