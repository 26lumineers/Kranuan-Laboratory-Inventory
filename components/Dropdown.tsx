import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';
import { usePopper } from 'react-popper';

type DropdownHandle = {
    close: () => void;
};

type DropdownProps = {
    placement?: any;
    offset?: [number, number];
    btnClassName?: string;
    button: React.ReactNode;
    children: React.ReactNode;
};

const Dropdown = forwardRef<DropdownHandle, DropdownProps>(
    ({ placement = 'bottom-end', offset = [0, 8], btnClassName, button, children }, ref) => {
        const [visible, setVisible] = useState(false);

        const referenceRef = useRef<HTMLButtonElement | null>(null);
        const popperRef = useRef<HTMLDivElement | null>(null);

        const { styles, attributes } = usePopper(
            referenceRef.current,
            popperRef.current,
            {
                placement,
                modifiers: [
                    {
                        name: 'offset',
                        options: { offset },
                    },
                ],
            }
        );

        const handleDocumentClick = (event: MouseEvent) => {
            const target = event.target as Node;

            if (
                referenceRef.current?.contains(target) ||
                popperRef.current?.contains(target)
            ) {
                return;
            }

            setVisible(false);
        };

        useEffect(() => {
            document.addEventListener('mousedown', handleDocumentClick);
            return () => {
                document.removeEventListener('mousedown', handleDocumentClick);
            };
        }, []);

        useImperativeHandle(ref, () => ({
            close() {
                setVisible(false);
            },
        }));

        return (
            <>
                <button
                    ref={referenceRef}
                    type="button"
                    className={btnClassName}
                    onClick={() => setVisible((prev) => !prev)}
                >
                    {button}
                </button>

                {visible && (
                    <div
                        ref={popperRef}
                        style={styles.popper}
                        {...attributes.popper}
                        className="z-50"
                    >
                        {children}
                    </div>
                )}
            </>
        );
    }
);

Dropdown.displayName = 'Dropdown';

export default Dropdown;