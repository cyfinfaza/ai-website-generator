export function exportFile(html, conversation) {
	const fileString = `<!-- ${JSON.stringify(conversation)} -->\n${html}`;
	const blob = new Blob([fileString], { type: "text/html" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = "website.html";
	a.click();
}
