import { useMutation, useQuery, useQueryClient } from "react-query";
import { useParams } from "react-router-dom"
import { VersementService } from "../../services/versement.service";
import { Button, Group, LoadingOverlay, SimpleGrid, Table, Text, TextInput, rem } from "@mantine/core";
import { App, Divider,Modal,Popconfirm,Tag,Button as Buttond } from "antd";
import { Dropzone, FileWithPath, PDF_MIME_TYPE } from '@mantine/dropzone';
import { FaEye, FaFilePdf, FaTrash, FaUpload } from "react-icons/fa";
import { fr } from "date-fns/locale/fr";
import { DocVersementService } from "../../services/docversement.service";
import { useState } from "react";
import { useForm } from "@mantine/form";
import { yupResolver } from 'mantine-form-yup-resolver';
import * as yup from 'yup';
import { useAppStore } from "../../common/Loader/store";
import { USER_ROLE } from "../../acl/Ability";
import { format } from "date-fns";
import { FaX } from "react-icons/fa6";


const schema = yup.object().shape({
    nom: yup.string().required('Invalid nom'),
    versement: yup.string().required('Versement Invalide')
  });
  

function Versement() {

const {id} = useParams()
const { role } = useAppStore() as any;
const {message} = App.useApp();
const qc = useQueryClient();
const [files, setFiles] = useState<FileWithPath[]>([]);
const [isModalOpen, setIsModalOpen] = useState(false);

const form = useForm({
    initialValues:{
     nom:'',
     versement: id
    },
    validate: yupResolver(schema),
 });

const showModal = () => {
    setIsModalOpen(true);
  };
  
  
  const handleCancel = () => {
    setIsModalOpen(false);
  };
  const versementService = new VersementService();
  const docVersementService = new DocVersementService();
  const key = ['get_versement',id];
  const keydocs = ["get_Docs",id];
  const {data: docs,isLoading: loadingDocs} = useQuery(keydocs,() => docVersementService.getByVersement(id!));
  const {data,isLoading} = useQuery(key, () => versementService.getOne(id!));
  const previews = files.map((file, index) => {
    return <Tag color="blue"  key={index}>{file.path} </Tag>;
  });
  

  const {mutate:uploadDocs,isLoading:loadingUpldoc} = useMutation((data: FormData) => docVersementService.create(data),{
    onSuccess:(_) => {
      message.success("Enregistrement des fichiers effectué");
      qc.invalidateQueries(keydocs);
      setFiles([]);
    }
  })

  
  
  const {mutate:deleteDoc,isLoading:loadingDelete} = useMutation((id:string) => docVersementService.delete(id),{
    onSuccess:(_) => {
        message.success("La suppression est effective.");
        qc.invalidateQueries(keydocs);
    },
    onError:(_) => {
    message.error('Erreur de Suppression');
    }
  });
  
  
  const uploadFiles = () => {
    if(form.isValid()){
    const {versement,nom} = form.values;
    setIsModalOpen(false);
    if(files.length !== 0){
    const fd = new FormData();
     fd.append('versement', versement!);
     fd.append('nom',nom);
     for (let i=0;i<files.length;i++){
      fd.append("files", files[i] as Blob);
     }
      uploadDocs(fd);
    }
    }
    else {
      message.error('Le formulaire est Invalide !')
    }
    
  }
  
  
  const confirm = (id : string) => {
    deleteDoc(id)
  };

  const cancel = () => {
    message.info("L'action a été annulé !");
  };

  const reSetFiles = (files: FileWithPath[]) => {
    form.reset();
    form.setFieldValue('engagement',id);
    setFiles(files);
  }

  const ViewDoc = (path: string) => {
    const fullPath = import.meta.env.VITE_BACKURL + "/uploads/versements-files/"+ path ;
    window.open(fullPath,'_blank')?.focus();
  }

  return (
    <>
     <LoadingOverlay
         visible={isLoading || loadingDelete || loadingDocs }
         zIndex={1000}
         overlayProps={{ radius: 'sm', blur: 2 }}
         loaderProps={{ color: 'blue', type: 'bars' }}
       />
       <div className="w-full">
            <Divider className="w-96" />
            {(role === USER_ROLE.DAF  || role === USER_ROLE.BUDGET) && <div>
            <Dropzone
                    h={200}
                    loading={loadingUpldoc}
                    onDrop={(files) => reSetFiles(files)}
                    onReject={() => message.error(`Formats acceptés : .pdf`) }
                    maxSize={10 * 1024 ** 2}
                    accept={PDF_MIME_TYPE}
                        >
                <Group justify="center" gap="xl" mih={150} style={{ pointerEvents: 'none' }}>
                <Dropzone.Accept>
                  <FaUpload
                    style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-blue-6)' }}
                  />
                </Dropzone.Accept>
                <Dropzone.Reject>
                  <FaX
                    style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-red-6)' }}
                  />
                </Dropzone.Reject>
                <Dropzone.Idle>
                  <FaFilePdf
                    style={{ width: rem(52), height: rem(52), color: 'var(--mantine-color-green-6)' }}
                  />
                </Dropzone.Idle>

                <div>
                  <Text size="xl" inline>
                    Glissez et déposez un fichier PDF ou cliquez pour en ajouter un.
                  </Text>
                  <Text size="sm" c="dimmed" inline mt={7}>
                  Chaque ficher ne devra pas excéder 10 Mo.
                  </Text>
                </div>
              </Group>
            </Dropzone>
            <SimpleGrid cols={{ base: 1, sm: 4 }} mt={previews.length > 0 ? 'xl' : 0}>
                {previews}
              </SimpleGrid>
            <Button className="w-full mx-2 my-2" leftSection={<FaUpload />} onClick={showModal}>Ajouter pièces jointes</Button>
            <Divider />
            <div className="p-2 font-semibold bg-blue-600 text-white text-lg">Liste des pièces jointes :</div>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>NOM</Table.Th>
                  <Table.Th>DATE</Table.Th>
                  <Table.Th>ACTION</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
              {docs?.map((d:any) => (
                <Table.Tr key={d._id}>
                <Table.Td>{d.nom}</Table.Td>
                <Table.Td>{format(d.createdAt,'dd/MM/yyyy',{locale:fr})}</Table.Td>
                <Table.Td>
                <Buttond
                  type="primary"
                  icon={<FaEye className="text-blue-400"
                  />}
                  onClick={() => ViewDoc(d.path)}
                />
                <Popconfirm
                title="Suppression"
                description="Etes vous sure de supprimer?"
                onConfirm={() => confirm(d._id)}
                onCancel={() => cancel()}
                okText="Confirmer"
                okButtonProps={{className: "bg-blue-500"}}
                cancelButtonProps={{className: "bg-red-500"}}
                cancelText="Annuler"
              >
                <Buttond
                  type="primary"
                  icon={<FaTrash className="text-red-500"/>}
                  loading={loadingDelete}
                />
                </Popconfirm>
                </Table.Td>
              </Table.Tr>
              ))}
              </Table.Tbody>
            </Table>
            </div>}
        
  </div>
  <Modal title="Noms Fichiers" open={isModalOpen} okButtonProps={{className:"bg-blue-400"}} onOk={uploadFiles} onCancel={handleCancel}>
        <form onSubmit={(e) => e.preventDefault()}>
          <TextInput
          withAsterisk
          label="DESIGNATION FICHIERS"
          {...form.getInputProps('nom')}
          />
        </form>
      </Modal>
    </>
  )
}

export default Versement