import icon from "../assets/icon.svg?raw";

export function GET() {
  return new Response(icon, { headers: { "Content-Type": "image/svg+xml" } });
}
