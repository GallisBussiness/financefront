import { useMutation, useQuery, useQueryClient } from "react-query";
import { CompteService } from "../../../services/compte.service";
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

const schema = yup.object().shape({
  code: yup.number().required("code invalid"),
  libelle: yup.string().required('Invalid libelle'),
  classe: yup.string().required('Classe invalide')
});

function Comptes() {
const [opened, { open, close }] = useDisclosure(false);
const [openedU, { open:openU, close:closeU }] = useDisclosure(false);
const { message } = App.useApp();
const key = 'get_comptes';
const compteService = new CompteService();
const qc = useQueryClient();
const {data,isLoading} = useQuery(key,() => compteService.getAll());
const form = useForm({
    initialValues: {
      libelle: '',
      code:'',
      classe: ''
    },
    validate: yupResolver(schema),
  });
  const formU = useForm({
    initialValues: {
    _id:'',
    code:0,
    libelle: '',
    classe: ''
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
 
const {mutate:createCompte,isLoading:loadingCreate} = useMutation((data) => compteService.create(data),{
    onSuccess:(_) => {
        message.success("La compte a été ajouté avec succès");
        close();
        qc.invalidateQueries(key);
        form.reset()
    },
    onError:(_) => {
    message.error("Impossible d'ajouter le compte");
    }
});

const {mutate:updateCompte,isLoading:loadingU} = useMutation((data: any) => compteService.update(data.id, data.data),{
    onSuccess:(_) => {
        message.success("La compte a été ajouté avec succès");
        closeU();
        qc.invalidateQueries(key);
    },
    onError:(_) => {
    message.error("Impossible d'ajouter la compte");
    }
});

const {mutate:deleteCompte,isLoading:loadingDelete} = useMutation((id:string) => compteService.delete(id),{
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
  formU.setValues(data);
  openU();
}
const footer = `Total : ${data ? data.length : 0} comptes.`;
const classeTemplate = (row:any) => row.classe.replaceAll('_', ' ');


  return (
    <>
    <LoadingOverlay
         visible={loadingDelete}
         zIndex={1000}
         overlayProps={{ radius: 'sm', blur: 2 }}
         loaderProps={{ color: 'blue', type: 'bars' }}
       />
    <div className="my5 p-2 text-2xl font-semibold flex">GESTION  DES COMPTES</div>
   <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>
   <DataTable value={data} currentPageReportTemplate="{first} à {last} de {totalRecords}" size="small" stripedRows footer={footer} paginator rows={10} filters={filters} rowsPerPageOptions={[5, 10, 25, 50]} loading={isLoading} tableStyle={{ minWidth: '50rem' }}
    globalFilterFields={['libelle','code']} header={header}>
    <Column field="code" header="CODE" style={{ width: '25%' }}></Column>
    <Column field="libelle" header="LIBELLE" style={{ width: '25%' }}></Column>
    <Column field="classe" header="CLASSE" body={classeTemplate} style={{ width: '25%' }}></Column>
   <Column headerStyle={{ width: '4rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate} />
</DataTable>
   <Drawer opened={opened} onClose={close} title="CREATION  DE COMPTE">
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
        label="CLASSE"
        {...form.getInputProps('classe')}
        data={["PRODUIT_INVESTISSEMENT","CHARGE_INVESTISSEMENT","PRODUIT_DE_FONCTIONNEMENT","CHARGE_DE_FONCTIONNEMENT",]}
       />
       <div className="my-5">
           <Button type="submit">SAUVEGARDER</Button>
       </div>
       
     </form>
   </Drawer>

   <Drawer position="right" opened={openedU} onClose={closeU} title="MODIFICATION  DE COMPTE">
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
        label="CLASSE"
        {...formU.getInputProps('classe')}
        data={["PRODUIT_INVESTISSEMENT","CHARGE_INVESTISSEMENT","PRODUIT_DE_FONCTIONNEMENT","CHARGE_DE_FONCTIONNEMENT",]}
       />
       <div className="my-5">
           <Button type="submit">MODIFIER</Button>
       </div>
       
     </form>
   </Drawer>
   </>
  )
}

export default Comptes