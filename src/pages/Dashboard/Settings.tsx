import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import Comptes from './Params/Comptes';
import ComptesDivisionnaires from './Params/ComptesDivisionnaires';
import SousComptes from './Params/SousComptes';
import Utilisateurs from './Params/Utilisateurs';
import Fournisseurs from './Params/Fournisseurs';
import CategorieFournisseur from './Params/CategorieFournisseur';
import Banques from './Params/Banques';
import { FaMoneyBillTrendUp, FaUsers } from "react-icons/fa6";
import { FcInTransit } from "react-icons/fc";
import { BsBank2 } from "react-icons/bs";
import { MdAccountBalanceWallet,MdAccountBalance } from "react-icons/md";
import { MdAccountTree } from "react-icons/md";
import { Button, Result, Tabs } from 'antd';
import Budget from './Params/Budget';
import { useAppStore } from '../../common/Loader/store';
import { USER_ROLE } from '../../acl/Ability';


const Settings = () => {
  const { role } = useAppStore() as any;
const items = [
  {
    key: '0',
    label: 'BUDGET',
    children: <Budget />,
    icon: <FaMoneyBillTrendUp className="inline-block" />,
    disabled: role !== USER_ROLE.ADMIN
  },
  {
    key: '1',
    label: 'COMPTES',
    children:<Comptes />,
    icon: <MdAccountBalanceWallet  className="inline-block" />,
  },
  {
    key: '2',
    label: 'COMPTES DIVISIONNAIRES',
    children:<ComptesDivisionnaires />,
    icon: <MdAccountTree  className="inline-block" />,
  },
  {
    key: '3',
    label: 'SOUS COMPTES',
    children:<SousComptes />,
    icon: <MdAccountBalance  className="inline-block" />,
  },
  {
    key: '4',
    label: 'UTILISATEURS',
    children:<Utilisateurs />,
    icon: <FaUsers  className="inline-block" />,
    disabled: role !== USER_ROLE.ADMIN
  },
  {
    key: '5',
    label: 'FOURNISSEURS',
    children:<Fournisseurs />,
    icon: <FcInTransit  className="inline-block" />,
  },
  {
    key: '6',
    label: 'CATEGORIES FOURNISSEUR',
    children:<CategorieFournisseur />,
    icon: <FcInTransit  className="inline-block" />,
  },
  {
    key: '7',
    label: 'BANQUES',
    children:<Banques />,
    icon: <BsBank2  className="inline-block" />,
  }
];
  return (
      <div className="mx-auto">
        <Breadcrumb pageName="PARAMETRAGE" />
        {(role === USER_ROLE.ADMIN || role === USER_ROLE.DAF || role === USER_ROLE.BUDGET) ? <Tabs
        defaultActiveKey="1"
        items={items}
      /> :  <Result
    status="warning"
    title="vous ne pouvez pas acceder à cette section."
    extra={
      <Button type="primary" key="back">
        REVENIR  A L'ACCEUIL
      </Button>
    }
  />}
      </div>
  );
};

export default Settings;
