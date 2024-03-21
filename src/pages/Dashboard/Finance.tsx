import React from 'react';
import DefaultLayout from '../../layout/DefaultLayout';
import { Outlet} from 'react-router-dom';
import { useAppStore } from '../../common/Loader/store';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import { useQuery } from 'react-query';
import { getAuth } from '../../services/authservice';

const Finance: React.FC = () => {
  const auth:{prenom: string,nom: string,id: string,fonction: string} | null =  useAuthUser();
  const { setRole } = useAppStore() as any;
  const qk = ["auth", auth?.id];
  useQuery(qk, () => getAuth(auth?.id!), {
    onSuccess(d){
      setRole(d.role);
    },
    staleTime:1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });
  return (
    <DefaultLayout>
     <Outlet />
    </DefaultLayout>
  );
};

export default Finance;
