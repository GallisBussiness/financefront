import { useMutation, useQuery, useQueryClient } from "react-query";
import { SousCompteService } from "../../../services/souscompte.service";
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
import { CompteDivisionnaireService } from "../../../services/comptedivisionnaire.service";

const schema = yup.object().shape({
  code: yup.number().required("code invalid"),
  libelle: yup.string().required('Invalide libelle'),
  compte_divisionnaire: yup.string().required('Compte invalide')
});


function SousComptes() {

const [opened, { open, close }] = useDisclosure(false);
const [openedU, { open:openU, close:closeU }] = useDisclosure(false);
const { message } = App.useApp();
const key = 'get_souscomptes';
const keyComptes = 'get_compte_divisionnaires';
const souscompteservice = new SousCompteService();
const compteService  = new CompteDivisionnaireService();
const qc = useQueryClient();
const {data,isLoading} = useQuery(key,() => souscompteservice.getAll());
const {data:comptes} = useQuery(keyComptes,() => compteService.getAll());
const form = useForm({
    initialValues: {
      libelle: '',
      code:'',
      compte_divisionnaire: ''
    },
    validate: yupResolver(schema),
  });
  const formU = useForm({
    initialValues: {
    _id:'',
    code:0,
    libelle: '',
    compte_divisionnaire: ''
    },
    validate: yupResolver(schema),
  });

const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    annee: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
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
 
const {mutate:createCompte,isLoading:loadingCreate} = useMutation((data) => souscompteservice.create(data),{
    onSuccess:(_) => {
        message.success("Le sous compte a été ajouté avec succès");
        close();
        qc.invalidateQueries(key);
        form.reset();
    },
    onError:(_) => {
    message.error("Impossible d'ajouter le sous compte");
    }
});

const {mutate:updateCompte,isLoading:loadingU} = useMutation((data: any) => souscompteservice.update(data.id, data.data),{
    onSuccess:(_) => {
        message.success("Le sous-compte a été ajouté avec succès");
        closeU();
        qc.invalidateQueries(key);
    },
    onError:(_) => {
    message.error("Impossible d'ajouter la compte_divisionnaire");
    }
});

const {mutate:deleteCompte,isLoading:loadingDelete} = useMutation((id:string) => souscompteservice.delete(id),{
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
    deleteCompte(id)
  };
  
  const cancel = () => {
    message.info("L'action a été annulé !");
  };


const leftToolbarTemplate = () => {
    return (
        <div className="flex flex-wrap gap-2">
           <Button onClick={open}>NOUVEAU</Button>
        </div>
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
    createCompte(values);
}
const onUpdate = (values:any) => {
    const {_id,createdAt,updatedAt,__v,...rest} = values;
    updateCompte({id: _id,data: rest });
}

const handleUpdate  = (data: any) => {
  const {compte_divisionnaire} = data;
  formU.setValues({...data,compte_divisionnaire: compte_divisionnaire._id});
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
    <div className="p-2 text-2xl font-semibold flex">GESTION  DES SOUS-COMPTES</div>
   <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>
   <DataTable value={data} paginator size="small" stripedRows rows={10} filters={filters} rowsPerPageOptions={[5, 10, 25, 50]} loading={isLoading} tableStyle={{ minWidth: '50rem' }}
    globalFilterFields={['libelle','code']} header={header}>
    <Column field="code" header="CODE" style={{ width: '25%' }}></Column>
   <Column field="libelle" header="LIBELLE" style={{ width: '25%' }}></Column>
   <Column field="compte_divisionnaire.libelle" header="COMPTE DIVISIONNAIRE" style={{ width: '25%' }}></Column>
   <Column headerStyle={{ width: '4rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate} />
</DataTable>
   <Drawer opened={opened} onClose={close} title="CREATION  DE SOUSCOMPTE">
   <LoadingOverlay
         visible={loadingCreate}
         zIndex={1000}
         overlayProps={{ radius: 'sm', blur: 2 }}
         loaderProps={{ color: 'blue', type: 'bars' }}
       />
     <form onSubmit={form.onSubmit(onCreate)}>
      <NumberInput
       withAsterisk
       label="CODE"
       {...form.getInputProps('code')}
      />
     <TextInput
         withAsterisk
         label="LIBELLE"
         {...form.getInputProps('libelle')}
       />
       <Select
        withAsterisk
        label="COMPTE DIVISIONNAIRE"
        {...form.getInputProps('compte_divisionnaire')}
        data={comptes?.map((c:any) => ({label:c.libelle,value:c._id}))}
       />
       <div className="my-5">
           <Button type="submit">SAUVEGARDER</Button>
       </div>
       
     </form>
   </Drawer>

   <Drawer position="right" opened={openedU} onClose={closeU} title="MODIFICATION  DE SOUSCOMPTE">
   <LoadingOverlay
         visible={loadingU}
         zIndex={1000}
         overlayProps={{ radius: 'sm', blur: 2 }}
         loaderProps={{ color: 'blue', type: 'bars' }}
       />
     <form onSubmit={formU.onSubmit(onUpdate)}>
     <TextInput
         withAsterisk
         label="LIBELLE"
         {...formU.getInputProps('libelle')}
       />
       <Select
        withAsterisk
        label="COMPTE DIVISIONNAIRE"
        {...formU.getInputProps('compte_divisionnaire')}
        data={comptes?.map((c:any) => ({label:c.libelle,value:c._id}))}
       />
       <div className="my-5">
           <Button type="submit">MODIFIER</Button>
       </div>
       
     </form>
   </Drawer>
   </>
  )
}

export default SousComptes