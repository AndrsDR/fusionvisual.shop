import { useNavigate } from "react-router-dom";

export function useViewDesign() {
    const navigate = useNavigate();

    const viewDesign = (item) => {
        if (!item?.id) return;

        navigate(`/product/${item.id}`, {
            state: item
        });
    };

    return { viewDesign };
}
