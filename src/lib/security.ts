export function sanitizeInput(value: string): string {
  return Array.from(value)
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 32 && code !== 127 && char !== "<" && char !== ">";
    })
    .join("")
    .trim();
}

export function validatePassword(password: string) {
  const reasons: string[] = [];
  if (password.length < 12) reasons.push("Use at least 12 characters.");
  if (!/[A-Z]/.test(password)) reasons.push("Include at least one uppercase letter.");
  if (!/[a-z]/.test(password)) reasons.push("Include at least one lowercase letter.");
  if (!/\d/.test(password)) reasons.push("Include at least one number.");
  if (!/[^A-Za-z0-9]/.test(password)) reasons.push("Include at least one symbol.");

  return {
    valid: reasons.length === 0,
    reasons,
  };
}
