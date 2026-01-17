import { UserButton, useUser } from "@clerk/nextjs";

export const WorkspaceHeader = ({ fileName }: { fileName: string }) => {
    const { user } = useUser();
    return (
        <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="hidden lg:block">
                    <h1 className="text-lg font-semibold text-slate-900">Workspace</h1>
                    <p className="text-xs text-slate-500">{fileName}</p>
                </div>
                <div className="lg:hidden flex flex-col justify-center items-center">
                    <h1 className="text-lg font-semibold text-slate-900">Workspace</h1>
                    <p className="text-xs text-slate-500">{fileName}</p>
                </div>
            </div>

            {/* Profile */}
            <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-slate-900">{user?.firstName}</p>
                    <p className="text-xs text-slate-500">Free Plan</p>
                </div>
                <UserButton appearance={{
                    elements: {
                        userButtonAvatar: "w-12 h-12",  // Tailwind classes
                        userButtonTrigger: "p-2",
                    },
                }} />
            </div>
        </header>
    )
}