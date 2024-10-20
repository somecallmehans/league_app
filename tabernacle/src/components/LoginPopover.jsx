import React, { useState } from "react";
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
  Field,
  Input,
  Label,
  Button,
} from "@headlessui/react";
import { useLoginMutation } from "../api/apiSlice";
import auth from "../helpers/authHelpers";

export default function LoginPopover({ loggedIn, setLoggedIn }) {
  const [username, setUsername] = useState();
  const [password, setPassword] = useState();
  const [login] = useLoginMutation();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const result = await login({ username, password }).unwrap();
      auth.setToken(result.access, result.refresh);
      setLoggedIn(true);
    } catch (err) {
      console.error("Failed to login: ", err);
    }
  };

  return !loggedIn ? (
    <Popover className="relative">
      <PopoverButton className="self-end mr-2 rounded bg-sky-600 py-2 px-4 text-sm text-white data-[hover]:bg-sky-500 data-[active]:bg-sky-700">
        Login
      </PopoverButton>
      <Transition
        enter="transition duration-100 ease-out"
        enterFrom="transform scale-95 opacity-0"
        enterTo="transform scale-100 opacity-100"
        leave="transition duration-75 ease-out"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
      >
        <PopoverPanel
          anchor="bottom end"
          className="mt-2 divide-black/5 rounded-xl bg-black/50 text-sm/6"
        >
          <form onSubmit={handleLogin}>
            <div className="p-3">
              <Field className="py-2 px-3">
                <Label className="block text-white">Username</Label>
                <Input
                  name="username"
                  type="text"
                  onChange={(e) => setUsername(e.target.value)}
                />
              </Field>

              <Field className="py-2 px-3">
                <Label className="block text-white">Password</Label>
                <Input
                  name="password"
                  type="password"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <div className="flex justify-center">
                <Button
                  type="submit"
                  className="rounded bg-sky-600 py-2 px-4 text-sm text-white data-[hover]:bg-sky-500 data-[active]:bg-sky-700"
                >
                  Submit
                </Button>
              </div>
            </div>
          </form>
        </PopoverPanel>
      </Transition>
    </Popover>
  ) : (
    <Button
      onClick={() => {
        setLoggedIn(false);
        auth.removeToken();
      }}
      className="self-end mr-2 rounded bg-sky-600 py-2 px-4 text-sm text-white data-[hover]:bg-sky-500 data-[active]:bg-sky-700"
    >
      Logout
    </Button>
  );
}
