// https://sharegpt.com/c/fsZTWHu
export function extractImagesFromMarkdown(markdownString) {
  const imageUrls = [];
  const imageRegex = /!\[.*?\]\((.*?)\)/g;
  let match;

  while ((match = imageRegex.exec(markdownString)) !== null) {
    imageUrls.push(match[1]);
  }

  return imageUrls;
}