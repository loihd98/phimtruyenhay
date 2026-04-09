import { Metadata } from "next";
import VipPageClient from "./VipPageClient";
import Layout from "@/components/layout/Layout";

export const metadata: Metadata = {
    title: "VIP — Nâng cấp tài khoản | Phim Truyện Hay",
    description:
        "Nâng cấp tài khoản VIP để truy cập toàn bộ thư viện, không quảng cáo, chất lượng audio cao và nhiều quyền lợi độc quyền khác.",
    openGraph: {
        title: "VIP — Nâng cấp tài khoản | Phim Truyện Hay",
        description:
            "Nâng cấp tài khoản VIP để truy cập toàn bộ thư viện, không quảng cáo và nhiều quyền lợi khác.",
    },
};

export default function VipPage() {
    return <Layout><VipPageClient /></Layout>;
}
