// layouts/CustomerLayout.tsx
import React from "react";
import CustomerTopbar from "../components/customer/CustomerTopbar";

interface CustomerLayoutProps {
    children: React.ReactNode;
    noPadding?: boolean;
    noTopPadding?: boolean;
    transparentBg?: boolean;
}

const CustomerLayout: React.FC<CustomerLayoutProps> = ({
                                                           children,
                                                           noPadding = false,
                                                           noTopPadding = false,
                                                           transparentBg = false
                                                       }) => {
    return (
        <div className={`min-h-screen ${transparentBg ? "" : "bg-gray-50"}`}>
            <CustomerTopbar />
            <main
                className={`
                    flex-1 transition-all duration-300
                    min-h-[calc(100vh-4rem)]
                    ${noTopPadding ? "" : "pt-16"}
                `}
            >
                {noPadding
                    ? children
                    : <div className="p-4 sm:p-6">{children}</div>
                }
            </main>
        </div>
    );
};

export default CustomerLayout;
