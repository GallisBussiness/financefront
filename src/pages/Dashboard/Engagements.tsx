import { useMutation, useQuery, useQueryClient } from "react-query";
import { EngagementService } from "../../services/engagement.service";
import { useDisclosure } from "@mantine/hooks";
import { ActionIcon, Autocomplete, Button, Drawer, LoadingOverlay, NumberInput,Select,TextInput} from "@mantine/core";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toolbar } from "primereact/toolbar";
import { useForm } from "@mantine/form";
import { yupResolver } from 'mantine-form-yup-resolver';
import * as yup from 'yup';
import { App, Popconfirm } from "antd";
import { BsFillPenFill } from 'react-icons/bs'
import { useState } from "react";
import { FilterMatchMode } from "primereact/api";
import { FaFolder, FaSearch, FaTrash } from "react-icons/fa";
import { FournisseurService } from "../../services/fournisseur.service";
import { BordereauService } from "../../services/bordereau.service";
import { DateInput } from "@mantine/dates";
import { CreditService } from "../../services/credit.service";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import useAuthUser from "react-auth-kit/hooks/useAuthUser";
import { Can } from "../../acl/Can";
import { useAppStore } from "../../common/Loader/store";
import { EtatEngagement, USER_ROLE } from "../../acl/Ability";
import { CLASSE } from "../../services/classe.service";
import { BudgetService } from "../../services/budget.service";
import { uniq } from "lodash";


const formatNumber = (n: number) => String(n).replace(/(.)(?=(\d{3})+$)/g,'$1 ');


const schema = yup.object().shape({
    date: yup.date().required('Invalid date'),
    objet: yup.string().required('invalid objet'),
    credit:yup.string().required('invalid credit'),
    beneficiaire: yup.string().nullable(),
    fournisseur: yup.string().nullable(),
    bordereau: yup.string().required('Bordereau is required'),
    montant: yup.number().required(),
    auteur: yup.string().required()
  });


function Engagements({data,etat}:{data:any;etat: string}) {
    const [opened, { open, close }] = useDisclosure(false);
    const [openedU, { open:openU, close:closeU }] = useDisclosure(false);
    const { message } = App.useApp();
    const { role } = useAppStore() as any;
    const navigate = useNavigate()
    const auth:{prenom: string,nom: string,id: string,fonction: string} | null =  useAuthUser();
    const key = 'get_engagements';
    const keyB = 'get_bordereaus';
    const keyF = 'get_fournisseurs';
    const keyC = 'get_credit';
    const keyE = "get_engagements";
    const engagementService = new EngagementService();
    const fournisseurService = new FournisseurService();
    const bordereauService = new BordereauService();
    const creditService = new CreditService();
    const qc = useQueryClient();
    const {data:fournisseurs} = useQuery(keyF,() => fournisseurService.getAll());
    const {data:bordereaus} = useQuery(keyB,() => bordereauService.getAll(),{
        onSuccess(_) {
            form.setFieldValue("bordereau", getLastBordereau(_))
        }
    });
    const {data:credits} = useQuery(keyC,() =>creditService.getAll());

    const {data:engmts,isLoading:loadingE} = useQuery(keyE,() => engagementService.getAll());
    const keyBu = 'get_budgets';
    const budgetService = new BudgetService(); 
    const {data:crs,isLoading:isLoadingBu} = useQuery(keyBu,() => budgetService.findAll());
    const getLastBordereau = (tab:any) : string => {
      try {
        const r = tab.length > 0 ? tab[0]?._id ?? '' : '';
        return r;
      } catch (error) {
        return '';
      }
        
    }

    const form = useForm({
        initialValues: {
            date: new Date(),
            objet: '',
            credit:'',
            beneficiaire: '',
            fournisseur: null,
            bordereau: '',
            montant: 0,
            auteur: auth?.id
        },
        validate: yupResolver(schema),
      });
      const formU = useForm({
        initialValues: {
        _id:'', 
        date: '',
        objet: '',
        credit:'',
        beneficiaire: '',
        fournisseur: null,
        bordereau: '',
        montant: 0,
        auteur: auth?.id
        },
        validate: yupResolver(schema),
      });
    
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        "credit.libelle": { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    });
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    
    const onGlobalFilterChange = (e: { target: { value: any; }; }) => {
        const value = e.target.value;
        let _filters = { ...filters };
    
        _filters['global'].value = value;
    
        setFilters(_filters);
        setGlobalFilterValue(value);
    };
    const renderHeader = () => {
        return (
            <div className="flex">
                    <TextInput value={globalFilterValue} leftSection={<FaSearch/>} onChange={onGlobalFilterChange} placeholder="Rechercher..." />
            </div>
        );
    };
    
    const header = renderHeader();
     
    const {mutate:createEngagement,isLoading:loadingCreate} = useMutation((data) => engagementService.create(data),{
        onSuccess:(_) => {
            message.success("L engagement a été ajouté avec succès");
            close();
            qc.invalidateQueries(key);
        },
        onError:(_) => {
        message.error("Impossible d'ajouter le engagement");
        }
    });
    
    const {mutate:updateEngagement,isLoading:loadingU} = useMutation((data: any) => engagementService.update(data.id, data.data),{
        onSuccess:(_) => {
            message.success("L engagement a été modifié avec succès");
            closeU();
            qc.invalidateQueries(key);
        },
        onError:(_) => {
        message.error("Impossible d'ajouter la engagement");
        }
    });
    
    const {mutate:deleteEngagement,isLoading:loadingDelete} = useMutation((id:string) => engagementService.delete(id),{
        onSuccess:(_) => {
            message.success("La suppression est effective.");
            closeU();
            qc.invalidateQueries(key);
        },
        onError:(_) => {
        message.error('Erreur de Suppression');
        }
    });
    
    
      const confirm = (id : string) => {
        deleteEngagement(id)
      };
      
      const cancel = () => {
        message.info("L'action a été annulé !");
      };
    
    
    const leftToolbarTemplate = () => {
        return (
          <Can I={role} a="CREATE_ENGAGEMENT">
               <div className="flex flex-wrap">
               <Button onClick={open}>NOUVEAU</Button>
            </div>
          </Can>
        );
    };
    
    const actionBodyTemplate = (rowData: any) => {
        return <div className="flex items-center justify-center space-x-1">
        {(role === USER_ROLE.BUDGET || role === USER_ROLE.DAF) && <>
          {(rowData.etat === EtatEngagement.BROUILLON  || rowData.etat === EtatEngagement.INVALIDE || rowData.etat === EtatEngagement.REJETE) && <ActionIcon type="button"  onClick={() => handleUpdate(rowData)}>
        <BsFillPenFill className="text-white"/>
        </ActionIcon>}
        {(rowData.etat === EtatEngagement.BROUILLON) && 
        <Popconfirm
        title="Suppression"
        description="Etes vous sure de supprimer?"
        onConfirm={() => confirm(rowData._id)}
        onCancel={() => cancel()}
        okText="Confirmer"
        okButtonProps={{className: "bg-blue-500"}}
        cancelButtonProps={{className: "bg-red-500"}}
        cancelText="Annuler"
      >
        <ActionIcon type="button" bg="red">
        <FaTrash className="text-white"/>
        </ActionIcon>
        </Popconfirm>}
        </>
        }
        <ActionIcon type="button" bg="green"  onClick={() => navigate(rowData._id)}>
        <FaFolder className="text-white"/>
        </ActionIcon>
        </div>;
        
    }
    
    const onCreate = (values:any) => {
         const {credit,montant} = values;
         const cr = crs.charges.find((c:any) => c._id === credit);
         const t = cr?.engagements.reduce((acc:any,cur:any) => acc + cur.montant,0);
         const rest = cr.prevision - t;
         if(montant > rest) {
          message.error(`Credit Insuffisant !: solde disponible ${rest}`);
         }
         else {
          createEngagement({...values});
         }
        
    }
    const onUpdate = (values:any) => {
        const {_id,createdAt,updatedAt,__v,...rest} = values;
        updateEngagement({id: _id,data: rest });
    }
    
    const handleUpdate  = (data: any) => {
      const {fournisseur,bordereau,credit,date} = data;
      const nd = new Date(date);
      formU.setValues({...data, fournisseur: fournisseur?._id ?? null,bordereau: bordereau?._id,date:nd,credit:credit?._id});
      openU();
    }

    const benTemplate = (row:any) => {
     return  `${row?.beneficiaire ?? ''} | ${row?.fournisseur?.denomination ?? ''}`;
    }

    const dateTemplate = (row:any) => format(row?.date,'dd/MM/yyyy');
    const creditTemplate = (row:any) => `${row?.credit?.souscompte?.code} ${row?.credit?.souscompte?.libelle}`;

    const rowClass = (data:any) => {
      return {
          'bg-grey-100': etat == EtatEngagement.BROUILLON,
          'bg-cyan-100': etat == EtatEngagement.SOUMIS,
          'bg-blue-200': etat == EtatEngagement.VALIDE,
          'bg-amber-100': etat == EtatEngagement.INVALIDE,
          'bg-red-100': etat == EtatEngagement.REJETE,
          'bg-green-100': etat == EtatEngagement.PAYE,
      };
  };

  return (
    <>
    <LoadingOverlay
         visible={loadingDelete || isLoadingBu || loadingE}
         zIndex={1000}
         overlayProps={{ radius: 'sm', blur: 2 }}
         loaderProps={{ color: 'blue', type: 'bars' }}
       />
    {/* <div className="p-2 text-2xl font-semibold flex">GESTION  DES ENGAGEMENTS</div> */}
   <Toolbar left={leftToolbarTemplate}></Toolbar>
   <DataTable value={data} paginator size="small" stripedRows rows={10} rowClassName={rowClass} filters={filters} rowsPerPageOptions={[5, 10, 25, 50]} tableStyle={{ minWidth: '50rem' }}
    globalFilterFields={['numero','montant','fournisseur.denomination','beneficiaire','credit.souscompte.code','credit.souscompte.libelle']} header={header} >
     <Column field="numero" sortable header="NUMERO" style={{ width: '15%' }}></Column>
     <Column field="date" header="DATE" body={dateTemplate} style={{ width: '5%' }}></Column>
     <Column field="credit" sortable header="IMPUTATION" body={creditTemplate} style={{ width: '30%' }}></Column>
    <Column field="fournisseur.denomination" sortable header="BENEFICIARE" body={benTemplate} style={{ width: '30%' }}></Column>
    <Column field="montant" header="MONTANT" sortable body={(row) => formatNumber(row.montant)} style={{ width: '15%' }} pt={{
            bodyCell:{ className:"text-right"}
        }}></Column>
   <Column headerStyle={{ width: '4rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate} />
</DataTable>
   <Drawer opened={opened} onClose={close} title="CREATION ENGAGEMENT">
   <LoadingOverlay
         visible={loadingCreate}
         zIndex={1000}
         overlayProps={{ radius: 'sm', blur: 2 }}
         loaderProps={{ color: 'blue', type: 'bars' }}
       />
     <form onSubmit={form.onSubmit(onCreate)}>
        <DateInput
         withAsterisk
         label="DATE"
         {...form.getInputProps('date')}
         locale="fr"
        />
        <Autocomplete
         withAsterisk
         label="OBJET"
         {...form.getInputProps('objet')}
         data={uniq(engmts?.map((e:any) => e.objet)) ?? []}
        />
       <Select
        withAsterisk
        searchable
        label="CREDIT"
        {...form.getInputProps('credit')}
        data={credits?.filter((r:any) => {
          const c = r?.souscompte?.compte_divisionnaire?.compte?.classe;
           return (c === CLASSE.CHARGE_DE_FONCTIONNEMENT) || (c === CLASSE.CHARGE_INVESTISSEMENT)
        }).map((c:any) => ({label:`${c?.souscompte?.code} | ${c?.souscompte?.libelle}`,value:c._id}))}
       />
       <TextInput
         label="BENEFICIARE"
         {...form.getInputProps('beneficiaire')}
        />
         <Select
        label="FOURNISSEUR"
        {...form.getInputProps('fournisseur')}
        data={fournisseurs?.map((c:any) => ({label:c?.denomination,value:c?._id}))}
       />
        <Select
        withAsterisk
        label="BORDEREAU"
        {...form.getInputProps('bordereau')}
        data={bordereaus?.map((c:any) => ({label:c.nom,value:c._id}))}
       />
        <NumberInput
       withAsterisk
       label="MONTANT"
       {...form.getInputProps('montant')}
      />
       <div className="my-5">
           <Button type="submit">SAUVEGARDER</Button>
       </div>
       
     </form>
   </Drawer>

   <Drawer position="right" opened={openedU} onClose={closeU} title="MODIFICATION  DE ENGAGEMENT">
   <LoadingOverlay
         visible={loadingU}
         zIndex={1000}
         overlayProps={{ radius: 'sm', blur: 2 }}
         loaderProps={{ color: 'blue', type: 'bars' }}
       />
     <form onSubmit={formU.onSubmit(onUpdate)}>
     <DateInput
         withAsterisk
         label="DATE"
         {...formU.getInputProps('date')}
         locale="fr"
        />
        <Autocomplete
         withAsterisk
         label="OBJET"
         {...formU.getInputProps('objet')}
         data={uniq(engmts?.map((e:any) => e.objet)) ?? []}
        />
       <Select
        withAsterisk
        searchable
        label="CREDIT"
        {...formU.getInputProps('credit')}
        data={credits?.filter((r:any) => {
          const c = r?.souscompte?.compte_divisionnaire.compte.classe;
           return (c === CLASSE.CHARGE_DE_FONCTIONNEMENT) || (c === CLASSE.CHARGE_INVESTISSEMENT)
        }).map((c:any) => ({label:`${c?.souscompte?.code} | ${c?.souscompte?.libelle}`,value:c._id}))}
       />
       <TextInput
         label="BENEFICIARE"
         {...formU.getInputProps('beneficiaire')}
        />
         <Select
        label="FOURNISSEUR"
        {...formU.getInputProps('fournisseur')}
        data={fournisseurs?.map((c:any) => ({label:c.denomination,value:c._id}))}
       />
        <Select
        withAsterisk
        label="BORDEREAU"
        {...formU.getInputProps('bordereau')}
        data={bordereaus?.map((c:any) => ({label:c.nom,value:c._id}))}
       />
        <NumberInput
       withAsterisk
       label="MONTANT"
       {...formU.getInputProps('montant')}
      />
       <div className="my-5">
           <Button type="submit">MODIFIER</Button>
       </div>
       
     </form>
   </Drawer>
   </>
  )
}

export default Engagements