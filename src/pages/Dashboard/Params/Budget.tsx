import { useMutation, useQuery, useQueryClient } from "react-query";
import { BudgetService } from "../../../services/budget.service";
import { useDisclosure } from "@mantine/hooks";
import { ActionIcon, Button, Drawer, LoadingOverlay, Switch, TextInput, Textarea } from "@mantine/core";
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
    annee: yup.string().required('Invalid email'),
    description: yup
      .string()
  });

function Budget() {
const [opened, { open, close }] = useDisclosure(false);
const [openedU, { open:openU, close:closeU }] = useDisclosure(false);
const { message } = App.useApp();
const key = 'get_budgets';
const budgetService = new BudgetService(); 
const qc = useQueryClient();
const {data,isLoading} = useQuery(key,() => budgetService.getAll());
const form = useForm({
    initialValues: {
      annee: '',
      description: '',
    },
    validate: yupResolver(schema),
  });
  const formU = useForm({
    initialValues: {
    _id:'',
      annee: '',
      description: '',
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
 
const {mutate:createBudget,isLoading:loadingCreate} = useMutation((data) => budgetService.create(data),{
    onSuccess:(_) => {
        message.success("Le budget a été ajouté avec succès");
        close();
        qc.invalidateQueries(key);
        form.reset();
    },
    onError:(_) => {
    message.error("Impossible d'ajouter le budget");
    }
});

const {mutate:updateBudget,isLoading:loadingU} = useMutation((data: any) => budgetService.update(data.id, data.data),{
    onSuccess:(_) => {
        message.success("Le budget a été ajouté avec succès");
        closeU();
        qc.invalidateQueries(key);
    },
    onError:(_) => {
    message.error("Impossible d'ajouter le budget");
    }
});

const {mutate:deleteBudget,isLoading:loadingDelete} = useMutation((id:string) => budgetService.delete(id),{
    onSuccess:(_) => {
        message.success("La suppression est effective.");
        closeU();
        qc.invalidateQueries(key);
    },
    onError:(_) => {
    message.error('Erreur de Suppression');
    }
});

const { mutate: toggleState, isLoading: loadingUpdate } = useMutation(
    (data:any) =>  budgetService.toggle(data._id, data.data),
    {
      onSuccess: (_) => {
        qc.invalidateQueries(key);
        message.success("L'etat du budget a été modifié avec succès");
      },
      onError: (_) => {
        message.error("Une erreur est survenue lors de la modification de l'état");
      },
    }
  );

  const confirm = (id : string) => {
    deleteBudget(id)
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
const actifTemplate = (row: { etat: any; _id: any; }) => <Switch checked={row.etat} size='xs' onChange={(e: { currentTarget: { checked: any; }; }) => handleChangeState(e.currentTarget.checked,row._id)} />;

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

const handleChangeState = (v: any,id: any) => {
    const data = {_id: id, data: {etat : v}};
    toggleState(data);
  };

const onCreate = (values:any) => {
    createBudget(values);
}
const onUpdate = (values:any) => {
    const {_id,createdAt,updatedAt,__v,...rest} = values;
    updateBudget({id: _id,data: rest });
}

const handleUpdate  = (data: any) => {
    formU.setValues(data);
    openU();
}


  return (
    <>
     <LoadingOverlay
          visible={loadingUpdate || loadingDelete}
          zIndex={1000}
          overlayProps={{ radius: 'sm', blur: 2 }}
          loaderProps={{ color: 'blue', type: 'bars' }}
        />
    <div className="my5 p-2 text-2xl font-semibold flex">GESTION  DES BUDGETS</div>
    <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>
    <DataTable value={data} paginator size="small" stripedRows rows={10} filters={filters} rowsPerPageOptions={[5, 10, 25, 50]} loading={isLoading} tableStyle={{ minWidth: '50rem' }}
     globalFilterFields={['annee']} header={header}>
    <Column field="annee" header="ANNEE" style={{ width: '25%' }}></Column>
    <Column field="description" header="DESCRIPTION" style={{ width: '25%' }}></Column>
    <Column field="etat" header="ETAT" body={actifTemplate} sortable style={{ minWidth: '4rem' }} />
    <Column headerStyle={{ width: '4rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} body={actionBodyTemplate} />
</DataTable>
    <Drawer opened={opened} onClose={close} title="CREATION  DE BUDGET" >
    <LoadingOverlay
          visible={loadingCreate}
          zIndex={1000}
          overlayProps={{ radius: 'sm', blur: 2 }}
          loaderProps={{ color: 'blue', type: 'bars' }}
        />
      <form onSubmit={form.onSubmit(onCreate)}>
      <TextInput
          withAsterisk
          label="ANNEE"
          placeholder="2###"
          {...form.getInputProps('annee')}
        />
        <Textarea
          label="DESCRIPTION"
          {...form.getInputProps('description')}
        />
        <div className="my-5">
            <Button type="submit">SAUVEGARDER</Button>
        </div>
        
      </form>
    </Drawer>

    <Drawer position="right" opened={openedU} onClose={closeU} title="MODIFICATION  DE BUDGET">
    <LoadingOverlay
          visible={loadingU}
          zIndex={1000}
          overlayProps={{ radius: 'sm', blur: 2 }}
          loaderProps={{ color: 'blue', type: 'bars' }}
        />
      <form onSubmit={formU.onSubmit(onUpdate)}>
      <TextInput
          withAsterisk
          label="ANNEE"
          placeholder="2###"
          {...formU.getInputProps('annee')}
        />
        <Textarea
          label="DESCRIPTION"
          {...formU.getInputProps('description')}
        />
        <div className="my-5">
            <Button type="submit">MODIFIER</Button>
        </div>
        
      </form>
    </Drawer>
   
    </>
  )
}

export default Budget