import { useMutation, useQuery, useQueryClient } from "react-query";
import { CreditService } from "../../services/credit.service";
import { useDisclosure } from "@mantine/hooks";
import { ActionIcon, Button, Drawer, LoadingOverlay, NumberInput,Select,TextInput} from "@mantine/core";
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
import { FaSearch, FaTrash } from "react-icons/fa";
import { SousCompteService } from "../../services/souscompte.service";
import { BudgetService } from "../../services/budget.service";
import { Can } from "../../acl/Can";
import { useAppStore } from "../../common/Loader/store";


const formatNumber = (n: number) => String(n).replace(/(.)(?=(\d{3})+$)/g,'$1 ');

const schema = yup.object().shape({
    souscompte: yup.string().required('Invalid souscredit'),
    prevision: yup.number().required('invalide prevision')
  });


function Credits() {

const [opened, { open, close }] = useDisclosure(false);
const [openedU, { open:openU, close:closeU }] = useDisclosure(false);
const { message } = App.useApp();
const { role } = useAppStore() as any;
const key = 'get_credits';
const keyB = 'get_active_budget';
const keySousCompte = 'get_souscomptes';
const creditService = new CreditService();
const sousCompteService = new SousCompteService();
const budgetService = new BudgetService();
const qc = useQueryClient();
const {data,isLoading} = useQuery(key,() => creditService.getAll());
const {data:souscompte} = useQuery(keySousCompte,() => sousCompteService.getAll());
const {data:budget} = useQuery(keyB,() => budgetService.findActive());
const form = useForm({
    initialValues: {
        souscompte: '',
        prevision: 0
    },
    validate: yupResolver(schema),
  });
  const formU = useForm({
    initialValues: {
    _id:'', 
    souscompte: '',
    prevision: 0
    },
    validate: yupResolver(schema),
  });

const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    budget: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
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
 
const {mutate:createCredit,isLoading:loadingCreate} = useMutation((data) => creditService.create(data),{
    onSuccess:(_) => {
        message.success("Le credit a été ajouté avec succès");
        close();
        qc.invalidateQueries(key);
    },
    onError:(_) => {
    message.error("Impossible d'ajouter le credit");
    }
});

const {mutate:updateCredit,isLoading:loadingU} = useMutation((data: any) => creditService.update(data.id, data.data),{
    onSuccess:(_) => {
        message.success("Le credit a été modifié avec succès");
        closeU();
        qc.invalidateQueries(key);
    },
    onError:(_) => {
    message.error("Impossible d'ajouter la credit");
    }
});

const {mutate:deleteCredit,isLoading:loadingDelete} = useMutation((id:string) => creditService.delete(id),{
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
    deleteCredit(id)
  };
  
  const cancel = () => {
    message.info("L'action a été annulé !");
  };


const leftToolbarTemplate = () => {
    return (
      <Can I={role} a="CREATE_CREDIT">
        <div className="flex flex-wrap">
           <Button onClick={open}>NOUVEAU</Button>
        </div>
      </Can>
    );
};

const actionBodyTemplate = (rowData: any) => {
    return <div className="flex items-center justify-center space-x-1">
    <ActionIcon type="button"  onClick={() => handleUpdate(rowData)}>
    <BsFillPenFill className="text-white"/>
    </ActionIcon>
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
    </Popconfirm>
    </div>;
    
}

const onCreate = (values:any) => {
    createCredit({...values,budget: budget?._id});
}
const onUpdate = (values:any) => {
    const {_id,createdAt,updatedAt,__v,...rest} = values;
    updateCredit({id: _id,data: rest });
}

const handleUpdate  = (data: any) => {
  const {souscompte} = data;
  formU.setValues({...data, souscompte: souscompte._id,budget: budget?._id});
  openU();
}

  return (
    <>
    <LoadingOverlay
         visible={loadingDelete}
         zIndex={1000}
         overlayProps={{ radius: 'sm', blur: 2 }}
         loaderProps={{ color: 'blue', type: 'bars' }}
       />
    <div className="p-2 text-2xl font-semibold flex">GESTION  DES CREDITS</div>
   <Toolbar left={leftToolbarTemplate}></Toolbar>
   <DataTable value={data} paginator rows={10} stripedRows size="small" filters={filters} rowsPerPageOptions={[5, 10, 25, 50]} loading={isLoading} tableStyle={{ minWidth: '50rem' }}
    globalFilterFields={['budget.annee','souscompte.libelle','souscompte.code','prevision']} header={header}>
    <Column field="souscompte.code" header="CODE" style={{ width: '5%' }}></Column>
    <Column field="budget.annee" header="BUDGET" style={{ width: '5%' }}></Column>
    <Column field="souscompte.libelle" header="SOUS COMPTE" style={{ width: '45%' }}></Column>
    <Column field="prevision" header="PREVISION" body={(row) => formatNumber(row.prevision)} style={{ width: '25%' }} pt={{
            bodyCell:{ className:"text-right"}
        }}></Column>
   <Column headerStyle={{ width: '4rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate} />
</DataTable>
   <Drawer opened={opened} onClose={close} title="CREATION  DE CREDIT">
   <LoadingOverlay
         visible={loadingCreate}
         zIndex={1000}
         overlayProps={{ radius: 'sm', blur: 2 }}
         loaderProps={{ color: 'blue', type: 'bars' }}
       />
     <form onSubmit={form.onSubmit(onCreate)}>
       <Select
        withAsterisk
        label="SOUS COMPTE"
        {...form.getInputProps('souscompte')}
        data={souscompte?.map((c:any) => ({label:c.libelle,value:c._id}))}
       />
        <NumberInput
       withAsterisk
       label="PREVISION"
       {...form.getInputProps('prevision')}
      />
       <div className="my-5">
           <Button type="submit">SAUVEGARDER</Button>
       </div>
       
     </form>
   </Drawer>

   <Drawer position="right" opened={openedU} onClose={closeU} title="MODIFICATION  DE CREDIT">
   <LoadingOverlay
         visible={loadingU}
         zIndex={1000}
         overlayProps={{ radius: 'sm', blur: 2 }}
         loaderProps={{ color: 'blue', type: 'bars' }}
       />
     <form onSubmit={formU.onSubmit(onUpdate)}>
     <Select
        withAsterisk
        label="SOUS COMPTE"
        {...formU.getInputProps('souscompte')}
        data={souscompte?.map((c:any) => ({label:c.libelle,value:c._id}))}
       />
        <NumberInput
       withAsterisk
       label="PREVISION"
       {...formU.getInputProps('prevision')}
      />
       <div className="my-5">
           <Button type="submit">MODIFIER</Button>
       </div>
       
     </form>
   </Drawer>
   </>
  )
}

export default Credits