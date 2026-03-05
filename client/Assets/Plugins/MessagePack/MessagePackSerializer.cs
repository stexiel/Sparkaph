using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace MessagePack
{
    public static class MessagePackSerializer
    {
        public static byte[] Serialize<T>(T obj)
        {
            using (var ms = new MemoryStream())
            {
                var writer = new MessagePackWriter(ms);
                writer.Write(obj);
                return ms.ToArray();
            }
        }

        public static T Deserialize<T>(byte[] bytes)
        {
            using (var ms = new MemoryStream(bytes))
            {
                var reader = new MessagePackReader(ms);
                return reader.Read<T>();
            }
        }
    }

    internal class MessagePackWriter
    {
        private readonly MemoryStream stream;

        public MessagePackWriter(MemoryStream stream)
        {
            this.stream = stream;
        }

        public void Write<T>(T obj)
        {
            if (obj == null)
            {
                stream.WriteByte(0xc0); // nil
                return;
            }

            var type = typeof(T);
            
            if (type == typeof(string))
            {
                WriteString(obj as string);
            }
            else if (type == typeof(int))
            {
                WriteInt((int)(object)obj);
            }
            else if (type == typeof(float))
            {
                WriteFloat((float)(object)obj);
            }
            else if (type == typeof(bool))
            {
                WriteBool((bool)(object)obj);
            }
            else if (type == typeof(byte[]))
            {
                WriteBytes(obj as byte[]);
            }
            else
            {
                // For complex objects, use reflection or manual serialization
                WriteObject(obj);
            }
        }

        private void WriteString(string value)
        {
            if (value == null)
            {
                stream.WriteByte(0xc0);
                return;
            }

            var bytes = Encoding.UTF8.GetBytes(value);
            var len = bytes.Length;

            if (len <= 31)
            {
                stream.WriteByte((byte)(0xa0 | len));
            }
            else if (len <= 255)
            {
                stream.WriteByte(0xd9);
                stream.WriteByte((byte)len);
            }
            else if (len <= 65535)
            {
                stream.WriteByte(0xda);
                stream.WriteByte((byte)(len >> 8));
                stream.WriteByte((byte)len);
            }
            else
            {
                stream.WriteByte(0xdb);
                stream.WriteByte((byte)(len >> 24));
                stream.WriteByte((byte)(len >> 16));
                stream.WriteByte((byte)(len >> 8));
                stream.WriteByte((byte)len);
            }

            stream.Write(bytes, 0, bytes.Length);
        }

        private void WriteInt(int value)
        {
            if (value >= 0 && value <= 127)
            {
                stream.WriteByte((byte)value);
            }
            else if (value >= -32 && value < 0)
            {
                stream.WriteByte((byte)(0xe0 | (value & 0x1f)));
            }
            else if (value >= sbyte.MinValue && value <= sbyte.MaxValue)
            {
                stream.WriteByte(0xd0);
                stream.WriteByte((byte)value);
            }
            else if (value >= short.MinValue && value <= short.MaxValue)
            {
                stream.WriteByte(0xd1);
                stream.WriteByte((byte)(value >> 8));
                stream.WriteByte((byte)value);
            }
            else
            {
                stream.WriteByte(0xd2);
                stream.WriteByte((byte)(value >> 24));
                stream.WriteByte((byte)(value >> 16));
                stream.WriteByte((byte)(value >> 8));
                stream.WriteByte((byte)value);
            }
        }

        private void WriteFloat(float value)
        {
            stream.WriteByte(0xca);
            var bytes = BitConverter.GetBytes(value);
            if (BitConverter.IsLittleEndian)
                Array.Reverse(bytes);
            stream.Write(bytes, 0, 4);
        }

        private void WriteBool(bool value)
        {
            stream.WriteByte((byte)(value ? 0xc3 : 0xc2));
        }

        private void WriteBytes(byte[] value)
        {
            if (value == null)
            {
                stream.WriteByte(0xc0);
                return;
            }

            var len = value.Length;
            if (len <= 255)
            {
                stream.WriteByte(0xc4);
                stream.WriteByte((byte)len);
            }
            else if (len <= 65535)
            {
                stream.WriteByte(0xc5);
                stream.WriteByte((byte)(len >> 8));
                stream.WriteByte((byte)len);
            }
            else
            {
                stream.WriteByte(0xc6);
                stream.WriteByte((byte)(len >> 24));
                stream.WriteByte((byte)(len >> 16));
                stream.WriteByte((byte)(len >> 8));
                stream.WriteByte((byte)len);
            }

            stream.Write(value, 0, value.Length);
        }

        private void WriteObject(object obj)
        {
            // Simple object serialization - extend as needed
            var json = UnityEngine.JsonUtility.ToJson(obj);
            WriteString(json);
        }
    }

    internal class MessagePackReader
    {
        private readonly MemoryStream stream;

        public MessagePackReader(MemoryStream stream)
        {
            this.stream = stream;
        }

        public T Read<T>()
        {
            var type = typeof(T);
            
            if (type == typeof(string))
            {
                return (T)(object)ReadString();
            }
            else if (type == typeof(int))
            {
                return (T)(object)ReadInt();
            }
            else if (type == typeof(float))
            {
                return (T)(object)ReadFloat();
            }
            else if (type == typeof(bool))
            {
                return (T)(object)ReadBool();
            }
            else if (type == typeof(byte[]))
            {
                return (T)(object)ReadBytes();
            }
            else
            {
                return ReadObject<T>();
            }
        }

        private string ReadString()
        {
            var b = stream.ReadByte();
            if (b == 0xc0) return null;

            int len;
            if ((b & 0xe0) == 0xa0)
            {
                len = b & 0x1f;
            }
            else if (b == 0xd9)
            {
                len = stream.ReadByte();
            }
            else if (b == 0xda)
            {
                len = (stream.ReadByte() << 8) | stream.ReadByte();
            }
            else if (b == 0xdb)
            {
                len = (stream.ReadByte() << 24) | (stream.ReadByte() << 16) | (stream.ReadByte() << 8) | stream.ReadByte();
            }
            else
            {
                throw new InvalidDataException("Invalid string format");
            }

            var bytes = new byte[len];
            stream.Read(bytes, 0, len);
            return Encoding.UTF8.GetString(bytes);
        }

        private int ReadInt()
        {
            var b = stream.ReadByte();
            
            if (b <= 0x7f) return b;
            if (b >= 0xe0) return (sbyte)b;
            
            if (b == 0xd0) return (sbyte)stream.ReadByte();
            if (b == 0xd1) return (short)((stream.ReadByte() << 8) | stream.ReadByte());
            if (b == 0xd2) return (stream.ReadByte() << 24) | (stream.ReadByte() << 16) | (stream.ReadByte() << 8) | stream.ReadByte();
            
            throw new InvalidDataException("Invalid int format");
        }

        private float ReadFloat()
        {
            var b = stream.ReadByte();
            if (b != 0xca) throw new InvalidDataException("Invalid float format");
            
            var bytes = new byte[4];
            stream.Read(bytes, 0, 4);
            if (BitConverter.IsLittleEndian)
                Array.Reverse(bytes);
            return BitConverter.ToSingle(bytes, 0);
        }

        private bool ReadBool()
        {
            var b = stream.ReadByte();
            if (b == 0xc2) return false;
            if (b == 0xc3) return true;
            throw new InvalidDataException("Invalid bool format");
        }

        private byte[] ReadBytes()
        {
            var b = stream.ReadByte();
            if (b == 0xc0) return null;

            int len;
            if (b == 0xc4)
            {
                len = stream.ReadByte();
            }
            else if (b == 0xc5)
            {
                len = (stream.ReadByte() << 8) | stream.ReadByte();
            }
            else if (b == 0xc6)
            {
                len = (stream.ReadByte() << 24) | (stream.ReadByte() << 16) | (stream.ReadByte() << 8) | stream.ReadByte();
            }
            else
            {
                throw new InvalidDataException("Invalid bytes format");
            }

            var bytes = new byte[len];
            stream.Read(bytes, 0, len);
            return bytes;
        }

        private T ReadObject<T>()
        {
            var json = ReadString();
            return UnityEngine.JsonUtility.FromJson<T>(json);
        }
    }
}
