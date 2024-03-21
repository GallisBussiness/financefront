import { useQuery } from "react-query";
import { EngagementService } from "../../services/engagement.service";
import { useState } from "react";
import { EtatEngagement, USER_ROLE } from "../../acl/Ability";
import Engagements from "./Engagements";
import { FaFirstdraft } from "react-icons/fa";
import Breadcrumb from "../../components/Breadcrumbs/Breadcrumb";
import { Badge, Tabs } from "antd";
import { LoadingOverlay } from "@mantine/core";
import { useAppStore } from "../../common/Loader/store";
import { FaHourglassEnd } from "react-icons/fa6";
import { GrValidate } from "react-icons/gr";
import { FcBadDecision } from "react-icons/fc";
import { MdPaid,MdOutlineKeyboardReturn } from "react-icons/md";


const EngagementList: React.FC = () => {
    const key = "get_engagements";
    const engagementService = new EngagementService();
    const { role } = useAppStore() as any;
    const [items,setItems] = useState<any[]>([])
    const {isLoading} = useQuery(key,() => engagementService.getAll(),{
        onSuccess:(data) => {
            const BROUILLONS = data.filter((e:any) => e.etat === EtatEngagement.BROUILLON);
            const SOUMIS = data.filter((e:any) => e.etat === EtatEngagement.SOUMIS);
            const VALIDES = data.filter((e:any) => e.etat === EtatEngagement.VALIDE);
            const INVALIDES = data.filter((e:any) => e.etat === EtatEngagement.INVALIDE);
            const PAYES = data.filter((e:any) => e.etat === EtatEngagement.PAYE);
            const REJETES = data.filter((e:any) => e.etat === EtatEngagement.REJETE);
            const it = [
                {
                  key: '0',
                  label: <Badge color="grey" count={BROUILLONS.length}>BROUILLONS</Badge>,
                  children: <Engagements data={BROUILLONS} etat={EtatEngagement.BROUILLON} />,
                  icon: <FaFirstdraft className="text-slate-500 inline-block" />,
                },
                {
                  key: '1',
                  label: <Badge color="cyan" count={SOUMIS.length}>EN ATTENTE DE VALIDATION</Badge>,
                  children: <Engagements data={SOUMIS} etat={EtatEngagement.SOUMIS} />,
                  icon: <FaHourglassEnd className="inline-block" />,
                },
                {
                  key: '2',
                  label: <Badge color="blue" count={VALIDES.length}>VALIDES</Badge>,
                  children:  <Engagements data={VALIDES} etat={EtatEngagement.VALIDE} /> ,
                  icon: <GrValidate className="text-blue-500 inline-block" />
                },
                {
                  key: '3',
                  label:<Badge color="orange" count={INVALIDES.length}>INVALIDES</Badge>,
                  children:  <Engagements data={INVALIDES} etat={EtatEngagement.INVALIDE} /> ,
                  icon: <FcBadDecision className="text-orange-400 inline-block" />,
                },
                {
                    key: '4',
                    label:<Badge color="red" count={REJETES.length}>REJETES</Badge>,
                    children:  <Engagements data={REJETES} etat={EtatEngagement.REJETE}/> ,
                    icon: <MdOutlineKeyboardReturn className="text-red-500 inline-block" />,
                  },
                {
                  key: '5',
                  label: <Badge color="green" count={PAYES.length}>PAYES</Badge>,
                  children:  <Engagements data={PAYES} etat={EtatEngagement.PAYE}/> ,
                  icon: <MdPaid className="text-green-500 inline-block" />,
                },
                
              ];
              let its:any[] = [];
                switch(role) {
                    case USER_ROLE.ADMIN:  its = it.filter(t => t.key === '1' || t.key === '2' || t.key === '3' || t.key === '4' || t.key === '5');
                     break;
                    case USER_ROLE.ACP: its = it.filter(t => t.key === '2' || t.key === '4' || t.key === '5');
                    break;
                    default: its = it;
                }
              setItems(its.map((o,i) => ({...o,key:`${i}`})));
        }
    });

  return (
    <div className="mx-auto">
          <LoadingOverlay
         visible={isLoading}
         zIndex={1000}
         overlayProps={{ radius: 'sm', blur: 2 }}
         loaderProps={{ color: 'blue', type: 'bars' }}
       />
        <Breadcrumb pageName="ENGAGEMENTS" />
          <Tabs
        defaultActiveKey="0"
        items={items}
      />
      </div>
  )
}

export default EngagementList