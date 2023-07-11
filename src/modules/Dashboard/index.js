import { useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom'
import avatar from "../../assets/avatar.svg";
import Input from "../../components/Input";
import { io } from "socket.io-client";
import Button from "../../components/Button"

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user:detail"))
  );
  const [messages, setMessages] = useState({});
  const [message, setMessage] = useState("");
  const [anotherUser, setAnotherUser] = useState({});
  const [users, setUsers] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [socket, setSocket] = useState(null)
  const messageRef = useRef(null);

  useEffect(() => {
  	setSocket(io('https://server-3phz.onrender.com:8080'))
  }, [])

  useEffect(() => {
  	socket?.emit('addUser', user?.id);
  	socket?.on('getUsers', users => {
      setActiveUsers(users);
  	})
  	socket?.on('getMessage', data => {
  		setMessages((prev) => {
        let temp = [...prev];
        temp.push(data);
        return temp;
      });
  	})
  }, [socket])

  useEffect(() => {
    messageRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch("https://server-3phz.onrender.com/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          authorization: localStorage.getItem("user:token"),
        },
      });
      const resData = await res.json();
      setUsers(resData.data);
    };
    fetchUsers();
  }, []);

  const fetchMessages = async (anotherUserId) => {
    const res = await fetch("https://server-3phz.onrender.com/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: localStorage.getItem("user:token"),
      },
      body: JSON.stringify({ anotherUserId: anotherUserId }),
    });
    const resData = await res.json();
    setMessages((prev) => resData.data);
    console.log(messages);
  };

  const sendMessage = async (e) => {
    setMessage("");
    socket?.emit('sendMessage', {
    	senderId: user?.id,
    	receiverId: anotherUser._id,
    	message,
    });
    const res = await fetch(`https://server-3phz.onrender.com/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: localStorage.getItem("user:token"),
      },
      body: JSON.stringify({
        message,
        receiverId: anotherUser?._id,
      }),
    });
    const resData = await res.json();
    setMessages((prev) => {
      let temp = [...prev];
      temp.push(resData.data);
      return temp;
    });
  };

  return (
    <div className="w-screen flex">
      <div className="w-[25%] h-screen bg-secondary overflow-scroll">
        <div className="flex items-center my-8 mx-14">
          <div>
            <img
              src={avatar}
              width={75}
              height={75}
              className="border border-primary p-[2px] rounded-full mb-12"
            />
          </div>
          <div className="ml-8">
            <h3 className="text-2xl">{user?.fullName}</h3>
            <p className="text-lg font-light">My Account</p>
            <Button logOut = {() => {
              localStorage.removeItem('user:token')
              localStorage.removeItem('user:detail')
              socket.emit('logOut', user.id);
              navigate('/users/sign_in')
              }}
              label={"Log out"} className="w-[100px] mt-4 pt-[3px] pb-[6px]" />
          </div>
        </div>
        <hr />
        <div className="mx-14 mt-10"></div>
      </div>
      <div className="w-[50%] h-screen bg-white flex flex-col items-center">
        {anotherUser?.fullName && (
          <div className="w-[75%] bg-secondary h-[80px] my-14 rounded-full flex items-center px-14 py-2">
            <div className="cursor-pointer">
              <img src={avatar} width={60} height={60} className="rounded-full" />
            </div>
            <div className="ml-6 mr-auto">
              <h3 className="text-lg">{anotherUser?.fullName}</h3>
              <p className="text-sm font-light text-gray-600">
                {anotherUser?.email}
              </p>
            </div>
            <div className="cursor-pointer">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="icon icon-tabler icon-tabler-phone-outgoing"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="black"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" />
                <line x1="15" y1="9" x2="20" y2="4" />
                <polyline points="16 4 20 4 20 8" />
              </svg>
            </div>
          </div>
        )}
        <div className="h-[75%] w-full overflow-scroll shadow-sm">
          <div className="p-14">
            {messages.length > 0 ? (
              messages.map(({ message, senderId }) => {
                return (
                  <>
                    <div
                      className={`max-w-[40%] rounded-b-xl p-4 mb-6 ${
                        senderId._id === user?.id
                          ? "bg-primary text-white rounded-tl-xl ml-auto"
                          : "bg-secondary rounded-tr-xl"
                      } `}
                    >
                      {message}
                    </div>
                    <div ref={messageRef}></div>
                  </>
                );
              })
            ) : (
              <div className="text-center text-lg font-semibold mt-24">
                No Messages or No Conversation Selected
              </div>
            )}
          </div>
        </div>
        {anotherUser?.fullName && (
          <div className="p-14 w-full flex items-center">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-[75%]"
              inputClassName="p-4 border-0 shadow-md rounded-full bg-light focus:ring-0 focus:border-0 outline-none"
            />
            <div
              className={`ml-4 p-2 cursor-pointer bg-light rounded-full ${
                !message && "pointer-events-none"
              }`}
              onClick={() => sendMessage()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="icon icon-tabler icon-tabler-send"
                width="30"
                height="30"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="#2c3e50"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <line x1="10" y1="14" x2="21" y2="3" />
                <path d="M21 3l-6.5 18a0.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a0.55 .55 0 0 1 0 -1l18 -6.5" />
              </svg>
            </div>
            <div
              className={`ml-4 p-2 cursor-pointer bg-light rounded-full ${
                !message && "pointer-events-none"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="icon icon-tabler icon-tabler-circle-plus"
                width="30"
                height="30"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="#2c3e50"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <circle cx="12" cy="12" r="9" />
                <line x1="9" y1="12" x2="15" y2="12" />
                <line x1="12" y1="9" x2="12" y2="15" />
              </svg>
            </div>
          </div>
        )}
      </div>
      <div className="w-[25%] h-screen bg-light px-8 py-16 overflow-scroll">
        <div className="text-primary text-lg">People</div>
        <div>
          {users.length > 0 ? (
            users.map((user, index) => {
              var isOnline = activeUsers.find((User) => User.userId === user._id)
              return (
                <div
                  className="flex items-center py-8 border-b border-b-gray-300"
                  key={index}
                >
                  <div
                    className="cursor-pointer flex items-center"
                    onClick={() => {
                      setMessages({});
                      fetchMessages(user._id);
                      setAnotherUser(user);
                    }}
                  >
                    <div>
                      <img
                        src={avatar}
                        className="w-[60px] h-[60px] rounded-full p-[2px] border border-primary"
                      />
                    </div>
                    <div className="ml-6">
                      <h3 className="text-lg font-semibold">
                        {user?.fullName}
                      </h3>
                      <p className="text-sm font-light text-gray-600">
                        {user?.email}
                      </p>
                      <h6 className="text-[#37CD19] text-sm"> {isOnline ? "Online":""} </h6>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-lg font-semibold mt-24">
              No Conversations
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
