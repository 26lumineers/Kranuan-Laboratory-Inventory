const Footer = () => {
    return (
        <div>
            <p className="truncate pt-6 text-center dark:text-white-dark ltr:sm:text-left rtl:sm:text-right">© {new Date().getFullYear()}. Lab Inventory. All rights reserved.</p>
        </div>
    );
};

export default Footer;
