import { TicketCommentDto } from "api/generated";
import htmr from "htmr";
import { Paperclip, Download } from "lucide-react";
import { Button } from "components/ui/button";

interface Props {
  ticketFormComment: TicketCommentDto[];
  handleDownload: (file: any) => void;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const timeString = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString() + " " + timeString;
};

const sanitizeCommentHtml = (htmlString: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  return doc.body.innerHTML;
};

const getCommentAuthorEmail = (comment: TicketCommentDto): string | null => {
  if (comment.createdByEmail?.trim()) return comment.createdByEmail.trim();
  if (comment.createdBy?.includes("@")) return comment.createdBy.trim();
  return null;
};

const getCommentAuthorLabel = (comment: TicketCommentDto): string => {
  const name = comment.createdByName?.trim();
  const department = comment.createdByDepartment?.trim();

  if (name && department) return `${name} - ${department}`;
  if (name) return name;
  if (department) return department;
  return comment.createdBy?.trim() || "Bilinmeyen kullanıcı";
};

const ChatComponent = ({ ticketFormComment, handleDownload }: Props) => {
  return (
    <div className="h-full overflow-y-auto px-4 pt-7 pb-4 scrollbar-thin scrollbar-track-black/5 scrollbar-thumb-black/10 hover:scrollbar-thumb-black/20">
      <div className="flex flex-col gap-6">
        {ticketFormComment.map((comment: TicketCommentDto, index: number) => {
          const isUserMessage = index % 2 === 0;
          const authorLabel = getCommentAuthorLabel(comment);
          const authorEmail = getCommentAuthorEmail(comment);

          return (
            <div
              key={`comment-${index}`}
              className="flex justify-center"
              style={{
                marginRight: isUserMessage ? "3em" : "0",
                marginLeft: isUserMessage ? "0" : "3em",
                opacity: 0,
                animation: `fadeSlideIn 0.3s ease forwards`,
                animationDelay: `${index * 0.1}s`,
              }}
            >
              <div className="w-4/5 max-w-full">
                <div
                  className={[
                    "rounded-[20px] border p-4 shadow-sm transition-all duration-200",
                    "hover:-translate-y-px hover:shadow-md",
                    isUserMessage
                      ? "bg-[#f8fafc] border-[#e2e8f0]"
                      : "bg-[#ebf5ff] border-[#bfdbfe]",
                  ].join(" ")}
                >
                  <div className="flex flex-col gap-3">
                    {/* Header: author + date */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-sm font-medium tracking-tight text-gray-800">
                          {authorLabel}
                        </span>
                        {authorEmail && (
                          <p className="mt-0.5 text-[11px] text-gray-400 break-all">
                            {authorEmail}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-xs text-gray-400">
                        {comment.createdDate ? formatDate(comment.createdDate) : ""}
                      </span>
                    </div>

                    {/* Divider */}
                    <hr className="border-black/5 opacity-60" />

                    {/* Comment body */}
                    {comment.body && (
                      <div className="wrap-break-word text-sm leading-relaxed text-gray-700 overflow-y-auto **:max-w-full">
                        {htmr(sanitizeCommentHtml(comment.body))}
                      </div>
                    )}

                    {/* Attachments */}
                    {comment.files && comment.files.length > 0 && (
                      <div className="mt-1 flex flex-col gap-2">
                        {comment.files.map((file: any, fileIndex: number) => (
                          <div
                            key={`file-${fileIndex}`}
                            className={[
                              "flex items-center justify-between rounded-xl border px-3.5 py-2.5",
                              "bg-white/65 backdrop-blur-sm transition-all duration-200",
                              "hover:bg-white/85 hover:-translate-y-px hover:shadow-sm",
                              isUserMessage ? "border-slate-100" : "border-slate-200",
                            ].join(" ")}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Paperclip className="size-4 shrink-0 rotate-45 text-blue-500" />
                              <span className="truncate text-[0.8125rem] text-gray-700">
                                {file.fileName}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(file)}
                              className="ml-2 shrink-0 h-7 gap-1.5 px-2.5 text-xs font-medium text-blue-500 hover:text-blue-700 hover:bg-blue-50 opacity-85 hover:opacity-100 transition-all"
                              aria-label={`${file.fileName} indir`}
                            >
                              <Download className="size-3.5 transition-transform group-hover:translate-y-0.5" />
                              İNDİR
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Keyframe animation injected once via a style tag */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  );
};

export default ChatComponent;
