import { Flex, Spin } from "antd";

const Loader = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-white">
      <Flex align="center" gap="middle">
    <Spin size="large" />
  </Flex>
    </div>
  );
};

export default Loader;
