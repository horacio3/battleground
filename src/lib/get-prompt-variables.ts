export function getPromptVariables(prompt: string): Record<string, string> {
  const variables = prompt.match(/\{\{([^}]+)\}\}/g) || [];
  return variables.reduce((acc, variable) => {
    const varName = variable.slice(2, -2);
    return { ...acc, [varName]: "" };
  }, {});
}
