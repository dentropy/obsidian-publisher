import yaml from 'js-yaml'

export function extractYamlFromMarkdown(markdownString) {
  const yamlRegex = /^---\s*\n([\s\S]*?)\n?---\s*\n/;
  const match = markdownString.match(yamlRegex);

  if (match && match[1]) {
    const extractedYaml = match[1];
    try {
      const yamlObject = yaml.load(extractedYaml);
      return yamlObject;
    } catch (error) {
      console.error('Error parsing YAML:', error);
      return null;
    }
  } else {
    return null;
  }
}