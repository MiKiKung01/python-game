import { Mail, Inbox, Send, Trash, Star, Search } from 'lucide-react';

export default function EmailClient() {
    const emails = [
        { id: 1, sender: "Job Offer", subject: "Freelance Project: Website Fix", time: "10:30 AM", preview: "Hi, We are looking for a developer to fix...", active: true },
        { id: 2, sender: "Server Alert", subject: "[CRITICAL] Server Down", time: "09:15 AM", preview: "System detected high latency in..." },
        { id: 3, sender: "Mom", subject: "Dinner tonight?", time: "Yesterday", preview: "Are you coming home for dinner?..." },
    ];

    return (
        <div className="flex h-full bg-white text-gray-800 font-sans">
            {/* Sidebar */}
            <div className="w-48 bg-gray-100 flex flex-col border-r border-gray-200">
                <div className="p-4 flex items-center gap-2 font-bold text-blue-600 text-xl">
                    <Mail /> Mail
                </div>
                <div className="px-2 space-y-1">
                    <div className="flex items-center gap-3 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg cursor-pointer font-medium">
                        <Inbox size={18} /> Inbox <span className="ml-auto bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">3</span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-200 rounded-lg cursor-pointer">
                        <Send size={18} /> Sent
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-200 rounded-lg cursor-pointer">
                        <Star size={18} /> Important
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-200 rounded-lg cursor-pointer">
                        <Trash size={18} /> Trash
                    </div>
                </div>
            </div>

            {/* Email List */}
            <div className="w-80 border-r border-gray-200 flex flex-col bg-white">
                <div className="p-3 border-b border-gray-200">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                        <input type="text" placeholder="Search mail" className="w-full bg-gray-100 rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {emails.map(email => (
                        <div key={email.id} className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${email.active ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}>
                            <div className="flex justify-between mb-1">
                                <span className={`text-sm ${email.active ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{email.sender}</span>
                                <span className="text-xs text-gray-400">{email.time}</span>
                            </div>
                            <div className="text-sm font-bold text-gray-800 mb-1 truncate">{email.subject}</div>
                            <div className="text-xs text-gray-500 truncate">{email.preview}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Reading Pane */}
            <div className="flex-1 flex flex-col bg-gray-50">
                <div className="p-6 bg-white shadow-sm m-4 rounded-lg flex-1 border border-gray-200">
                    <h2 className="text-2xl font-bold mb-4">Freelance Project: Website Fix</h2>
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">J</div>
                        <div>
                            <div className="font-bold">Job Offer</div>
                            <div className="text-xs text-gray-500">To: Me</div>
                        </div>
                    </div>
                    <div className="text-gray-700 leading-relaxed space-y-4">
                        <p>Hi,</p>
                        <p>We are looking for a Python developer to fix our backend API. It seems to be crashing when under load.</p>
                        <p>Budget: 5,000 THB</p>
                        <p>Are you available?</p>
                        <br />
                        <button className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700">Reply</button>
                    </div>
                </div>
            </div>
        </div>
    );
}