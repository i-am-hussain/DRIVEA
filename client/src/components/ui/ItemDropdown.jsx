import { MoreVerticalIcon, EyeIcon, Share2Icon, Edit2Icon, FolderInputIcon, Trash2Icon } from "lucide-react";
import { Dropdown, DropdownItem } from "./Dropdown";

export function ItemDropdown({ item, onPreview, onShare, onRename, onMove, onDelete }) {
    return (
        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <Dropdown
                width="w-48"
                trigger={
                    <button
                        type="button"
                        aria-label={`Actions for ${item?.name || "item"}`}
                        className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100"
                    >
                        <MoreVerticalIcon className="size-4" />
                    </button>
                }
            >
                {onPreview && (
                    <DropdownItem icon={EyeIcon} onClick={() => onPreview(item)}>
                        Preview
                    </DropdownItem>
                )}
                <DropdownItem icon={Share2Icon} onClick={() => onShare(item)}>
                    Share link
                </DropdownItem>
                <DropdownItem icon={Edit2Icon} onClick={() => onRename(item)}>
                    Rename
                </DropdownItem>
                <DropdownItem icon={FolderInputIcon} onClick={() => onMove(item)}>
                    Move to…
                </DropdownItem>
                <div className="my-1 h-px bg-slate-100" />
                <DropdownItem icon={Trash2Icon} danger onClick={() => onDelete(item)}>
                    Delete
                </DropdownItem>
            </Dropdown>
        </div>
    );
}
