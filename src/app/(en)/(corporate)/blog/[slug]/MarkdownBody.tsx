"use client";

import ReactMarkdown from "react-markdown";

interface Props {
  content: string;
}

export default function MarkdownBody({ content }: Props) {
  return (
    <div className="
      max-w-none text-slate-300 text-[15px] leading-[1.85]
      [&_h1]:mt-10 [&_h1]:mb-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-white
      [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white
      [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-[17px] [&_h3]:font-semibold [&_h3]:text-white
      [&_h4]:mt-6 [&_h4]:mb-2 [&_h4]:text-[15px] [&_h4]:font-semibold [&_h4]:text-white
      [&_p]:mb-5
      [&_ul]:mb-5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul>li]:mb-1.5
      [&_ol]:mb-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol>li]:mb-1.5
      [&_strong]:text-white [&_strong]:font-semibold
      [&_em]:text-slate-300 [&_em]:italic
      [&_a]:text-indigo-400 [&_a]:underline [&_a]:underline-offset-2
      [&_code]:rounded [&_code]:bg-white/[0.06] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px] [&_code]:font-mono
      [&_pre]:mb-5 [&_pre]:rounded-xl [&_pre]:bg-white/[0.05] [&_pre]:p-4 [&_pre]:overflow-x-auto
      [&_pre_code]:bg-transparent [&_pre_code]:p-0
      [&_blockquote]:border-l-2 [&_blockquote]:border-indigo-500/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-400
      [&_hr]:my-8 [&_hr]:border-white/[0.08]
    ">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
