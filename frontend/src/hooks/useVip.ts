import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store";
import { fetchVipStatus } from "../store/slices/vipSlice";

export const useVip = () => {
  const dispatch = useDispatch<AppDispatch>();
  const vip = useSelector((state: RootState) => state.vip);

  return {
    isVip: vip.isVip,
    subscription: vip.subscription,
    isLoading: vip.isLoading,
    refresh: () => dispatch(fetchVipStatus()),
  };
};
